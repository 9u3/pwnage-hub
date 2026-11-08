use hidapi::HidApi;
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::State;

const VENDOR_ID: u16 = 0x3662;
const TRINITY_WIRED_PID: u16 = 8197;
const TRINITY_WIRELESS_PID: u16 = 8198;

struct HidState {
    api: Mutex<HidApi>,
}

#[derive(Serialize, Deserialize, Clone)]
struct DeviceInfo {
    product_id: u16,
    product_name: String,
    is_wireless: bool,
    path: String,
    usage_page: u16,
    usage: u16,
    interface_number: i32,
}

#[tauri::command]
fn debug_enumerate(state: State<HidState>) -> Result<Vec<serde_json::Value>, String> {
    let mut api = state.api.lock().map_err(|e| e.to_string())?;
    api.refresh_devices().map_err(|e| e.to_string())?;
    let devices: Vec<serde_json::Value> = api
        .device_list()
        .filter(|d| d.vendor_id() == VENDOR_ID)
        .map(|d| {
            serde_json::json!({
                "vendor_id": format!("0x{:04X}", d.vendor_id()),
                "product_id": d.product_id(),
                "product_name": d.product_string().unwrap_or_default(),
                "usage_page": format!("0x{:04X}", d.usage_page()),
                "usage": format!("0x{:04X}", d.usage()),
                "interface_number": d.interface_number(),
                "path": d.path().to_string_lossy().to_string(),
            })
        })
        .collect();
    Ok(devices)
}

#[tauri::command]
fn list_devices(state: State<HidState>) -> Result<Vec<DeviceInfo>, String> {
    let mut api = state.api.lock().map_err(|e| e.to_string())?;
    api.refresh_devices().map_err(|e| e.to_string())?;
    let devices: Vec<DeviceInfo> = api
        .device_list()
        .filter(|d| {
            d.vendor_id() == VENDOR_ID
                && (d.product_id() == TRINITY_WIRED_PID
                    || d.product_id() == TRINITY_WIRELESS_PID)
                && d.usage_page() >= 0xFF00
        })
        .map(|d| DeviceInfo {
            product_id: d.product_id(),
            product_name: d
                .product_string()
                .unwrap_or_default()
                .to_string(),
            is_wireless: d.product_id() == TRINITY_WIRELESS_PID,
            path: d.path().to_string_lossy().to_string(),
            usage_page: d.usage_page(),
            usage: d.usage(),
            interface_number: d.interface_number(),
        })
        .collect();
    Ok(devices)
}

/// Try to send+receive a feature report on a given path.
/// Returns the response bytes on success, or an error string.
#[tauri::command]
fn probe_feature_report(state: State<HidState>, path: String) -> Result<Vec<u8>, String> {
    let api = state.api.lock().map_err(|e| e.to_string())?;
    let c_path = std::ffi::CString::new(path).map_err(|e| e.to_string())?;
    let device = api.open_path(&c_path).map_err(|e| e.to_string())?;
    // Try reading a feature report (report ID 0) — if the interface supports it this will succeed
    let mut buf = vec![0u8; 65];
    buf[0] = 0; // report ID
    let len = device
        .get_feature_report(&mut buf)
        .map_err(|e| format!("get_feature_report: {}", e))?;
    Ok(buf[..len].to_vec())
}

#[tauri::command]
fn hid_exchange(
    state: State<HidState>,
    path: String,
    data: Vec<u8>,
) -> Result<Vec<u8>, String> {
    let api = state.api.lock().map_err(|e| e.to_string())?;
    let c_path = std::ffi::CString::new(path.clone()).map_err(|e| e.to_string())?;
    let device = api.open_path(&c_path).map_err(|e| e.to_string())?;

    // Send feature report (report ID 0 prepended)
    let mut report = vec![0u8];
    report.extend_from_slice(&data);
    device
        .send_feature_report(&report)
        .map_err(|e| format!("send_feature_report on {}: {}", path, e))?;

    // Small delay for device to process
    std::thread::sleep(std::time::Duration::from_millis(10));

    // Read response
    let mut buf = vec![0u8; 65];
    buf[0] = 0; // report ID
    let len = device
        .get_feature_report(&mut buf)
        .map_err(|e| format!("get_feature_report on {}: {}", path, e))?;
    Ok(buf[1..len].to_vec()) // Strip report ID
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let api = HidApi::new().expect("Failed to initialize HID API");
    tauri::Builder::default()
        .manage(HidState {
            api: Mutex::new(api),
        })
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            debug_enumerate,
            list_devices,
            probe_feature_report,
            hid_exchange,
        ])
        .run(tauri::generate_context!())
        .expect("error while building tauri application");
}
