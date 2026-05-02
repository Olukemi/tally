# |||/ Tally

A tiny always-on-top desktop widget for tracking the things that matter — streaks, countdowns, and counters. Built with [Tauri](https://tauri.app) + vanilla JS.

> *How many days sober? Days until vacation? Glasses of water today? Tally knows.*

---
<img width="197" height="148" alt="image" src="https://github.com/user-attachments/assets/b6df11c8-8d71-488c-855e-3f22b5735d17" />

<img width="379" height="480" alt="image" src="https://github.com/user-attachments/assets/419c7a8b-2765-4cd8-94b1-636048e68417" />


## Features

- **Streak** — counts days since a start date. Reset when you slip up, start again.
- **Countdown** — counts down to a target date. Good for anticipation.
- **Counter** — a simple +/− tally. Good for reps, habits, anything you count.
- Multiple tallies with tabs — track everything at once
- Collapses to a tiny draggable pill so it's never in the way
- Always on top, transparent background, frameless — floats over everything
- Lives in your system tray, launches on startup
- Data saved locally, persists across restarts

---

## Download

Grab the latest installer for your OS from the [Releases](../../releases) page:

| Platform | File |
|----------|------|
| Windows  | `.msi` |
| macOS    | `.dmg` |
| Linux    | `.AppImage` |

No setup required — just download and run.

---

## Run it locally

### What you'll need

- [Node.js](https://nodejs.org) v18+
- [Rust](https://rustup.rs) (rustup installer)
- **Windows only:** [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) with "Desktop development with C++" checked
- **Linux only:** `sudo apt install libwebkit2gtk-4.0-dev libgtk-3-dev`

### Steps

```bash
# 1. Clone the repo
git clone https://github.com/Olukemi/tally.git
cd tally

# 2. Install dependencies
npm install

# 3. Run in dev mode (hot-reloads on save!)
npm run tauri dev
```

First run takes a few minutes while Rust compiles. After that it's fast.

### Build an installer

```bash
npm run tauri build
```

Your installer will be in `src-tauri/target/release/bundle/`.

---

## Releasing a new version

Tally uses GitHub Actions to automatically build installers for Windows, macOS, and Linux whenever you push a version tag.

```bash
git tag v1.0.0
git push origin v1.0.0
```

That's it. A draft release will appear on GitHub with all three installers attached. Review it and hit publish.

---

## Built with

- [Tauri](https://tauri.app) — lightweight desktop app framework
- [Vite](https://vitejs.dev) — frontend tooling
- [Inter](https://rsms.me/inter/) — typeface
- Vanilla JS, no frameworks

---

Made with ☕ by [Kemi](https://github.com/Olukemi)
