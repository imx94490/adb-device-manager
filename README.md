# ADB Device Manager

A modern desktop application for managing Android devices via ADB (Android Debug Bridge). Built with Electron, React, TypeScript, and Tailwind CSS.

![Cyberpunk Theme](https://img.shields.io/badge/Theme-Cyberpunk-00ffff)
![Electron](https://img.shields.io/badge/Electron-30.x-47848F)
![React](https://img.shields.io/badge/React-18.x-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6)

## Features

### Device Management
- View connected devices with detailed information (model, Android version, resolution, IP address)
- Support for both USB and WiFi connected devices
- Device status tracking: Online, Offline, Unauthorized, Disconnected
- Save device history for quick reconnection
- One-click reconnect for disconnected devices
- Remove devices from history

### Screen Control
- Real-time screen mirroring with adjustable FPS (1-20)
- Touch simulation via mouse clicks
- Swipe gesture support
- Quick key events: Home, Back, Menu, Volume, Power
- Screenshot capture

### APK Installation
- Drag & drop APK installation
- File browser for APK selection
- Real-time installation progress display
- Installation result feedback

### Log Management
- Real-time logcat streaming
- Log level filtering (Verbose/Debug/Info/Warning/Error/Fatal)
- Tag-based filtering
- Keyword search
- Auto-scroll toggle
- Save logs to file with configurable output path
- Historical log file management
- Delete and open log folder

### Settings
- Custom ADB path configuration
- Default port setting
- Auto-refresh interval configuration
- Log output path customization
- ADB availability check

## Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Electron 30 + Node.js
- **Build**: Vite + TypeScript
- **State Management**: Zustand
- **UI Theme**: Cyberpunk dark theme with neon accents

## Prerequisites

- Node.js 18+ 
- ADB (Android Debug Bridge) installed and accessible
- Android device with USB debugging enabled

## Installation

```bash
# Clone the repository
git clone https://github.com/imx94490/adb-device-manager.git

# Navigate to project directory
cd adb-device-manager

# Install dependencies
npm install
```

## Development

```bash
# Run in development mode
npm run dev:all
```

This will start both the Vite dev server and Electron app concurrently.

## Build

```bash
# Build the project
npm run build

# Package as executable (Windows)
npm run dist
```

Or use the one-click build script:
```bash
# Windows
build.bat
# or PowerShell
.\build.ps1
```

The executable will be located at:
```
release-output\win-unpacked\ADB Device Manager.exe
```

## Project Structure

```
adb-device-manager/
├── src/
│   ├── main/           # Electron main process
│   │   ├── adb/        # ADB command handlers
│   │   ├── ipc/        # IPC communication handlers
│   │   └── utils/      # Configuration utilities
│   ├── preload/        # Preload scripts (contextBridge)
│   └── renderer/       # React frontend
│       ├── components/ # UI components
│       ├── stores/     # Zustand state stores
│       ├── styles/     # CSS styles
│       └── types/      # TypeScript type definitions
├── public/             # Static assets
├── build.bat           # Windows build script
├── build.ps1           # PowerShell build script
└── package.json        # Project configuration
```

## ADB Commands Used

| Feature | Command |
|---------|---------|
| List devices | `adb devices -l` |
| Connect WiFi | `adb connect <IP:PORT>` |
| Disconnect | `adb disconnect <IP:PORT>` |
| Screenshot | `adb exec-out screencap -p` |
| Touch input | `adb shell input tap <x> <y>` |
| Swipe input | `adb shell input swipe <x1> <y1> <x2> <y2> <duration>` |
| Key event | `adb shell input keyevent <code>` |
| Install APK | `adb install -r <path>` |
| Logcat | `adb logcat -v time` |
| Device info | `adb shell getprop` |

## Screenshots

The application features a cyberpunk-inspired dark theme with:
- Neon cyan accent colors
- Grid background pattern
- Glowing effects on interactive elements
- Card-based device display
- Real-time status indicators

## Troubleshooting

### ADB Not Found
- Ensure ADB is installed and added to system PATH
- Or configure a custom ADB path in Settings

### Device Unauthorized
- Enable USB debugging on your Android device
- Accept the debugging authorization prompt on the device

### WiFi Connection Failed
- Ensure device and PC are on the same network
- Make sure ADB over WiFi is enabled on the device
- Try restarting ADB service: `adb kill-server && adb start-server`

### Screen Mirror Not Working
- Some devices may not support `adb exec-out screencap`
- The app will automatically fallback to `adb shell screencap` + `adb pull`

## License

MIT License

## Author

ADB Device Manager Team