# 🔥 Streak Widget

A minimal, always-on-top floating desktop widget for tracking streaks, countdowns, and counters. Built with [Tauri](https://tauri.app).

![Streak Widget Preview](preview.png)

## Features

- **Streak tracker** — Days since a date (e.g. "Days Without Incidents")
- **Countdown** — Days until a target date
- **Counter** — Simple +/− manual counter
- Multiple counters with tabs
- Always-on-top, transparent, frameless window
- Drag to reposition anywhere on screen
- Persists data across restarts

## Download

Go to the [Releases](../../releases) page and download the installer for your OS:

| Platform | File |
|----------|------|
| Windows | `.msi` |
| macOS | `.dmg` |
| Linux | `.AppImage` |

## Development

### Prerequisites

- [Node.js](https://nodejs.org) 18+
- [Rust](https://rustup.rs)
- On Linux: `libgtk-3-dev libwebkit2gtk-4.0-dev`

### Run locally

```bash
npm install
npm run tauri dev
```

### Build installers

```bash
npm run tauri build
```

Installers will be in `src-tauri/target/release/bundle/`.

## Releasing to GitHub

1. Push a version tag:
   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```
2. GitHub Actions builds `.msi`, `.dmg`, and `.AppImage` automatically.
3. A draft release appears — review and publish it.
