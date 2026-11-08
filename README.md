# Pwnage Hub

<div align="center">

  <img src="https://img.shields.io/badge/Status-Active-success.svg" alt="Status">
  <img src="https://img.shields.io/badge/Platform-Windows%20%7C%20Linux%20%7C%20macOS-blue.svg" alt="Platform">
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License">

  <p><strong>Standalone desktop app for configuring Pwnage mice</strong></p>
</div>

---

## What is this?

Pwnage's official config tool runs in a browser via WebHID, which means you need a specific browser open just to tweak your mouse settings. **Pwnage Hub** is a native desktop app (built with Tauri) that talks to your mouse directly over HID, so you can configure everything without touching a browser.

---

## Features

- **DPI stages** — view and edit all stages, switch between them
- **Polling rate** — 125 Hz to 8000 Hz
- **Sensor settings** — lift-off distance, angle snapping, motion sync
- **Debounce** — adjust click response timing
- **Sleep timeout** — set when the mouse goes to sleep
- **Device info** — firmware version, sensor model, connection type
- **Works wired and wireless**

---

## Supported devices

- **Trinity** (wired & wireless)
- Should work with other StormBreaker-based mice (StormBreaker Magnesium, Max CF) — untested

---

## Getting started

### Download

Grab the latest installer from [Releases](https://github.com/9u3/pwnage-hub/releases):
- **Windows** — `.exe` or `.msi`
- **Linux** — `.AppImage` or `.deb`
- **macOS** — `.dmg`

### Build from source

You'll need [Node.js](https://nodejs.org/) and [Rust](https://rustup.rs/).

```bash
git clone https://github.com/9u3/pwnage-hub.git
cd pwnage-hub
npm install
npx tauri build
```

Installers end up in `src-tauri/target/release/bundle/`.

For development:

```bash
npx tauri dev
```

**Linux** needs a few extra packages:

```bash
sudo apt install libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf libudev-dev
```

---

## Notes

- On Linux, your user may need to be in the `plugdev` group or have a udev rule for HID access.
- The app uses the same WASM module as the official Pwnage Drivers Hub for protocol handling.

---

## License

GNU GPLv3
