import { initWasm, StormBreaker, receiveData } from './wasm/bridge.js';

const { invoke } = window.__TAURI__.core;

let devicePath = null;
const PROFILE = 0;
let dpiStages = [];
let activeStage = 0;

function log(msg) {
  const el = document.getElementById('log');
  const line = document.createElement('div');
  line.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
  el.appendChild(line);
  el.scrollTop = el.scrollHeight;
  console.log(msg);
}

function hexDump(arr) {
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join(' ');
}

async function exchange(commandBytes) {
  log(`TX: ${hexDump(commandBytes)}`);
  const response = await invoke('hid_exchange', {
    path: devicePath,
    data: Array.from(commandBytes),
  });
  log(`RX: ${hexDump(response)}`);
  return new Uint8Array(response);
}

// --- Tab navigation ---
document.querySelectorAll('.nav-btn[data-tab]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.tab-page').forEach(p => p.classList.remove('active'));
    document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
  });
});

// --- Polling rate button grid ---
const rateGrid = document.getElementById('polling-rate-grid');
const rateSelect = document.getElementById('polling-rate');
rateGrid.querySelectorAll('.rate-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    rateGrid.querySelectorAll('.rate-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    rateSelect.value = btn.dataset.rate;
  });
});

function syncRateButtons(value) {
  rateGrid.querySelectorAll('.rate-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.rate === String(value));
  });
}

// --- DPI stage buttons ---
function renderDpiStages() {
  const container = document.getElementById('dpi-stages-container');
  container.innerHTML = '';
  dpiStages.forEach((stage, i) => {
    const btn = document.createElement('button');
    btn.className = 'dpi-stage-btn' + (i === activeStage ? ' active' : '');
    btn.textContent = i + 1;
    btn.title = `Stage ${i + 1}: ${stage.x} DPI`;
    btn.addEventListener('click', () => {
      activeStage = i;
      renderDpiStages();
      const s = dpiStages[activeStage];
      document.getElementById('dpi-slider').value = s.x;
      document.getElementById('dpi-value').textContent = s.x === s.y ? s.x : `X:${s.x} Y:${s.y}`;
    });
    container.appendChild(btn);
  });
}

// --- Log clear ---
document.getElementById('log-clear').addEventListener('click', () => {
  document.getElementById('log').innerHTML = '';
});

// --- Connect ---
async function connectDevice() {
  const btn = document.getElementById('connect-btn');
  btn.disabled = true;
  btn.textContent = 'Scanning...';

  try {
    const allDevs = await invoke('debug_enumerate');
    log(`All Pwnage HID interfaces (${allDevs.length}):`);
    for (const d of allDevs) {
      log(`  PID=${d.product_id} name="${d.product_name}" usage_page=${d.usage_page} usage=${d.usage} iface=${d.interface_number} path=${d.path}`);
    }

    const devices = await invoke('list_devices');
    log(`Candidate interfaces: ${devices.length}`);

    if (devices.length === 0) {
      log('No mouse found. Make sure the mouse is connected.');
      btn.disabled = false;
      btn.textContent = 'Connect';
      return;
    }

    let device = null;
    for (const d of devices) {
      log(`Probing usage_page=0x${d.usage_page.toString(16).toUpperCase()} usage=0x${d.usage.toString(16).toUpperCase()} iface=${d.interface_number}...`);
      try {
        await invoke('probe_feature_report', { path: d.path });
        log(`  -> Feature reports SUPPORTED`);
        device = d;
        break;
      } catch (e) {
        log(`  -> Not supported: ${e}`);
      }
    }

    if (!device) {
      log('No interface supports feature reports. Try reconnecting the mouse.');
      btn.disabled = false;
      btn.textContent = 'Connect';
      return;
    }

    devicePath = device.path;
    log(`Connected to: ${device.product_name} (PID ${device.product_id}) at ${device.path}`);

    document.getElementById('status').textContent = device.is_wireless ? 'Wireless' : 'Wired';
    document.getElementById('status').className = 'device-tag connected';
    document.getElementById('info-name').textContent = device.product_name || 'Trinity';
    document.getElementById('info-connection').textContent = device.is_wireless ? 'Wireless (2.4G)' : 'Wired (USB)';
    document.getElementById('no-device').style.display = 'none';
    document.getElementById('content').style.display = 'block';
    btn.textContent = 'Reconnect';
    btn.disabled = false;

    await readAllSettings();
  } catch (e) {
    log(`Connection error: ${e}`);
    btn.disabled = false;
    btn.textContent = 'Connect';
  }
}

async function readAllSettings() {
  log('Reading device settings...');

  try {
    let fwStr = '0.0.0.0';
    for (const deviceId of [0, 1]) {
      const fwBytes = new Uint8Array(64);
      fwBytes[2] = deviceId;
      fwBytes[3] = 16;
      fwBytes[5] = 129;
      const fwResp = await exchange(fwBytes);
      if (fwResp[6] === 129) {
        fwStr = `${fwResp[7]}.${fwResp[8]}.${fwResp[9]}.${fwResp[10]}`;
      } else if (fwResp[5] === 129) {
        fwStr = `${fwResp[6]}.${fwResp[7]}.${fwResp[8]}.${fwResp[9]}`;
      }
      if (fwStr !== '0.0.0.0') break;
    }
    document.getElementById('info-firmware').textContent = fwStr;
    log(`Firmware: ${fwStr}`);
  } catch (e) {
    log(`Failed to read firmware: ${e}`);
  }

  try {
    const smCmd = StormBreaker.getSensorModel();
    const smResp = await exchange(smCmd);
    const sensorModel = StormBreaker.parseSensorModel(smResp);
    log(`Sensor model: ${sensorModel}`);
    const smEl = document.getElementById('info-sensor');
    if (smEl) smEl.textContent = sensorModel;
  } catch (e) {
    log(`Failed to read sensor model: ${e}`);
  }

  try {
    const stagesCmd = StormBreaker.getDpiStagesInfo(PROFILE, 6);
    const stagesResp = await exchange(stagesCmd);
    const stagesParsed = StormBreaker.parseDpiStagesInfo(stagesResp);
    log(`DPI stages raw: ${JSON.stringify(Array.from(stagesParsed))}`);
    dpiStages = [];
    for (let i = 0; i < stagesParsed.length; i += 2) {
      dpiStages.push({ x: stagesParsed[i], y: stagesParsed[i + 1] });
    }
    log(`DPI stages: ${dpiStages.map((s,i) => `[${i}] X=${s.x} Y=${s.y}`).join(', ')}`);

    const activeCmd = StormBreaker.getDpiActiveStageInfo(PROFILE);
    const activeResp = await exchange(activeCmd);
    activeStage = StormBreaker.parseDpiActiveStageInfo(activeResp);
    log(`Active DPI stage: ${activeStage}`);

    renderDpiStages();

    if (dpiStages[activeStage]) {
      const s = dpiStages[activeStage];
      document.getElementById('dpi-slider').value = s.x;
      document.getElementById('dpi-value').textContent = s.x === s.y ? s.x : `X:${s.x} Y:${s.y}`;
    }
  } catch (e) {
    log(`Failed to read DPI: ${e}`);
  }

  try {
    const pollCmd = StormBreaker.getPollingInfo(PROFILE);
    const pollResp = await exchange(pollCmd);
    const pollParsed = StormBreaker.parsePollingInfo(pollResp);
    log(`Polling rate parsed: ${JSON.stringify(pollParsed)}`);
    if (typeof pollParsed === 'number') {
      rateSelect.value = pollParsed;
      syncRateButtons(pollParsed);
    }
  } catch (e) {
    log(`Failed to read polling rate: ${e}`);
  }

  try {
    const lodCmd = StormBreaker.getLodSetting(PROFILE);
    const lodResp = await exchange(lodCmd);
    const lodParsed = StormBreaker.parseLodSetting(lodResp);
    log(`LOD parsed: ${JSON.stringify(lodParsed)}`);
    if (typeof lodParsed === 'number') {
      document.getElementById('lod-setting').value = lodParsed;
    }
  } catch (e) {
    log(`Failed to read LOD: ${e}`);
  }

  try {
    const debResp = await exchange(new Uint8Array([0, 2, 3, 0, 136, PROFILE + 1, ...new Array(58).fill(0)]));
    const makeTime = debResp[7] || 0;
    const breakTime = debResp[8] || 0;
    log(`Debounce: makeTime=${makeTime}, breakTime=${breakTime}`);
    document.getElementById('debounce-time').value = makeTime;
  } catch (e) {
    log(`Failed to read debounce: ${e}`);
  }

  try {
    const asCmd = StormBreaker.getAngleSnap(PROFILE);
    const asResp = await exchange(asCmd);
    const asParsed = StormBreaker.parseAngleSnap(asResp);
    log(`Angle snap parsed: ${JSON.stringify(asParsed)}`);
    document.getElementById('angle-snap').checked = asParsed !== 0;
  } catch (e) {
    log(`Failed to read angle snap: ${e}`);
  }

  try {
    const msCmd = StormBreaker.getMotionSync(PROFILE);
    const msResp = await exchange(msCmd);
    log(`Motion sync raw: byte[7]=${msResp[7]}`);
    document.getElementById('motion-sync').checked = msResp[7] === 1;
  } catch (e) {
    log(`Failed to read motion sync: ${e}`);
  }

  try {
    const slCmd = StormBreaker.getSleepTime(PROFILE);
    const slResp = await exchange(slCmd);
    const slParsed = StormBreaker.parseSleepTime(slResp);
    log(`Sleep time parsed: ${JSON.stringify(slParsed)}`);
    if (typeof slParsed === 'number') {
      const rounded = Math.round(slParsed);
      document.getElementById('sleep-slider').value = rounded;
      document.getElementById('sleep-value').textContent = rounded;
    }
  } catch (e) {
    log(`Failed to read sleep time: ${e}`);
  }

  log('Settings read complete.');
}

// --- UI event handlers ---
document.getElementById('dpi-slider').addEventListener('input', (e) => {
  document.getElementById('dpi-value').textContent = e.target.value;
});

document.getElementById('sleep-slider').addEventListener('input', (e) => {
  document.getElementById('sleep-value').textContent = Math.round(e.target.value);
});

document.getElementById('apply-dpi').addEventListener('click', async () => {
  if (!devicePath) return;
  const dpi = parseInt(document.getElementById('dpi-slider').value);
  log(`Setting DPI to ${dpi} (stage ${activeStage}, ${dpiStages.length} stages)...`);
  try {
    if (dpiStages.length === 0) {
      log('No DPI stages loaded — read settings first');
      return;
    }
    dpiStages[activeStage].x = dpi;
    dpiStages[activeStage].y = dpi;
    const flat = new Int32Array(dpiStages.flatMap(s => [s.x, s.y]));
    log(`DPI flat array: ${Array.from(flat).join(', ')}`);
    const cmd = StormBreaker.setDpiStagesInfo(PROFILE, dpiStages.length, flat);
    log(`DPI set cmd: ${hexDump(cmd)}`);
    await exchange(cmd);
    document.getElementById('dpi-value').textContent = dpi;
    renderDpiStages();
    log('DPI applied.');
  } catch (e) {
    log(`Failed to set DPI: ${e}`);
  }
});

document.getElementById('apply-polling').addEventListener('click', async () => {
  if (!devicePath) return;
  const rate = parseInt(rateSelect.value);
  log(`Setting polling rate to ${rate} Hz...`);
  try {
    const cmd = StormBreaker.setPollingInfo(PROFILE, rate);
    await exchange(cmd);
    log('Polling rate applied.');
  } catch (e) {
    log(`Failed to set polling rate: ${e}`);
  }
});

document.getElementById('apply-sensor').addEventListener('click', async () => {
  if (!devicePath) return;
  try {
    const lod = parseInt(document.getElementById('lod-setting').value);
    log(`Setting LOD to ${lod}mm...`);
    const lodCmd = StormBreaker.setLodSetting(PROFILE, lod);
    await exchange(lodCmd);

    const debounce = parseInt(document.getElementById('debounce-time').value);
    log(`Setting debounce to ${debounce}ms...`);
    const debBytes = new Uint8Array(64);
    debBytes[2] = 2; debBytes[3] = 3; debBytes[5] = 8; debBytes[6] = PROFILE + 1;
    debBytes[7] = debounce; debBytes[8] = debounce;
    await exchange(debBytes);

    const angleSnap = document.getElementById('angle-snap').checked ? 1 : 0;
    log(`Setting angle snap to ${angleSnap}...`);
    const asCmd = StormBreaker.setAngleSnap(PROFILE, angleSnap);
    await exchange(asCmd);

    const motionSync = document.getElementById('motion-sync').checked ? 1 : 0;
    log(`Setting motion sync to ${motionSync}...`);
    const msCmd = StormBreaker.setMotionSync(PROFILE, motionSync);
    await exchange(msCmd);

    log('Settings applied.');
  } catch (e) {
    log(`Failed to apply settings: ${e}`);
  }
});

document.getElementById('apply-sleep').addEventListener('click', async () => {
  if (!devicePath) return;
  const seconds = parseFloat(document.getElementById('sleep-slider').value);
  log(`Setting sleep timeout to ${seconds}s...`);
  try {
    const cmd = StormBreaker.setSleepTime(PROFILE, seconds);
    await exchange(cmd);
    log('Sleep timeout applied.');
  } catch (e) {
    log(`Failed to set sleep timeout: ${e}`);
  }
});

document.getElementById('connect-btn').addEventListener('click', connectDevice);

async function init() {
  log('Loading WASM module...');
  try {
    const wasmUrl = new URL('./wasm/rust_app_bg.wasm', import.meta.url);
    await initWasm(fetch(wasmUrl));
    log('WASM module loaded successfully.');
  } catch (e) {
    log(`Failed to load WASM: ${e}`);
  }
}

init();
