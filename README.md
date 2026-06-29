# ADB Device Manager

一款现代化的 Android 设备管理桌面应用，基于 Electron + React + TypeScript + Tailwind CSS 构建。

![Cyberpunk Theme](https://img.shields.io/badge/Theme-Cyberpunk-00ffff)
![Electron](https://img.shields.io/badge/Electron-30.x-47848F)
![React](https://img.shields.io/badge/React-18.x-61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6)

## ✨ 功能特性

### 📱 设备管理
- 查看已连接设备的详细信息（型号、Android版本、分辨率、IP地址）
- 支持 USB 和 WiFi 连接的设备
- 设备状态追踪：在线、离线、未授权、已断开
- 保存设备历史记录，快速重连
- 一键重新连接已断开的设备
- 从历史记录中删除设备

### 🖥️ 屏幕控制
- 实时屏幕镜像，可调节帧率（1-20 FPS）
- 通过鼠标点击模拟触摸
- 支持滑动手势
- 快捷按键：Home、Back、Menu、音量、电源
- 截图功能

### 📦 APK 安装
- 拖放安装 APK 文件
- 文件浏览器选择 APK
- 实时显示安装进度
- 安装结果反馈

### 📋 日志管理
- 实时 logcat 流
- 日志级别过滤（Verbose/Debug/Info/Warning/Error/Fatal）
- 基于 Tag 的过滤
- 关键词搜索
- 自动滚动开关
- 保存日志到文件，可配置输出路径
- 历史日志文件管理
- 删除日志文件和打开日志文件夹

### ⚙️ 设置
- 自定义 ADB 路径配置
- 默认端口设置
- 自动刷新间隔配置
- 日志输出路径自定义
- ADB 可用性检查

## 🛠️ 技术栈

| 技术 | 说明 |
|------|------|
| **前端** | React 18 + TypeScript + Tailwind CSS |
| **后端** | Electron 30 + Node.js |
| **构建** | Vite + TypeScript |
| **状态管理** | Zustand |
| **UI 主题** | Cyberpunk 赛博朋克暗色主题 |

## 📋 系统要求

- Node.js 18+
- ADB (Android Debug Bridge) 已安装并可访问
- Android 设备已开启 USB 调试

## 🚀 快速开始

### 安装

```bash
# 克隆仓库
git clone https://github.com/imx94490/adb-device-manager.git

# 进入项目目录
cd adb-device-manager

# 安装依赖
npm install
```

### 开发模式

```bash
# 同时启动 Vite 开发服务器和 Electron 应用
npm run dev:all
```

### 构建

```bash
# 构建项目
npm run build

# 打包为可执行文件（Windows）
npm run dist
```

或使用一键构建脚本：

```bash
# Windows
build.bat

# 或 PowerShell
.\build.ps1
```

构建完成后，可执行文件位于：
```
release-output\win-unpacked\ADB Device Manager.exe
```

## 📁 项目结构

```
adb-device-manager/
├── src/
│   ├── main/           # Electron 主进程
│   │   ├── adb/        # ADB 命令处理器
│   │   │   ├── AdbService.ts    # ADB 基础服务
│   │   │   └── AdbDevice.ts     # 设备操作业务层
│   │   ├── ipc/        # IPC 通信处理器
│   │   │   ├── deviceIpc.ts     # 设备管理
│   │   │   ├── screenIpc.ts      # 屏幕控制
│   │   │   ├── apkIpc.ts         # APK 安装
│   │   │   ├── logIpc.ts        # 日志管理
│   │   │   └── configIpc.ts      # 配置管理
│   │   └── utils/      # 配置工具
│   ├── preload/        # 预加载脚本（contextBridge）
│   └── renderer/       # React 前端
│       ├── components/ # UI 组件
│       │   ├── device/   # 设备管理组件
│       │   ├── screen/   # 屏幕控制组件
│       │   ├── apk/      # APK 安装组件
│       │   ├── log/      # 日志管理组件
│       │   ├── layout/   # 布局组件
│       │   └── settings/ # 设置组件
│       ├── stores/     # Zustand 状态存储
│       ├── styles/     # CSS 样式
│       └── types/      # TypeScript 类型定义
├── build.bat           # Windows 构建脚本
├── build.ps1           # PowerShell 构建脚本
└── package.json        # 项目配置
```

## 🔧 ADB 命令参考

| 功能 | 命令 |
|------|------|
| 列出设备 | `adb devices -l` |
| WiFi 连接 | `adb connect <IP:PORT>` |
| 断开连接 | `adb disconnect <IP:PORT>` |
| 截图 | `adb exec-out screencap -p` |
| 触摸输入 | `adb shell input tap <x> <y>` |
| 滑动输入 | `adb shell input swipe <x1> <y1> <x2> <y2> <duration>` |
| 按键事件 | `adb shell input keyevent <code>` |
| 安装 APK | `adb install -r <path>` |
| 日志抓取 | `adb logcat -v time` |
| 设备信息 | `adb shell getprop` |

## 🎨 界面预览

应用采用赛博朋克风格的暗色主题：
- 霓虹青色作为主要强调色
- 网格背景图案
- 交互元素的发光效果
- 卡片式设备展示
- 实时状态指示器

### 主要界面

**设备列表**
- 按状态分组显示（在线/未授权/离线/已断开）
- 设备卡片显示型号、IP、状态
- 快速重连和删除按钮

**屏幕控制**
- 实时屏幕镜像
- 触摸模拟
- 快捷键按钮
- FPS 显示

**日志管理**
- 实时日志流
- 级别和 Tag 过滤
- 搜索功能
- 保存到文件

## 🔍 故障排除

### ADB 未找到
- 确保 ADB 已安装并添加到系统 PATH
- 或在设置中配置自定义 ADB 路径

### 设备未授权
- 在 Android 设备上启用 USB 调试
- 在设备上接受调试授权提示

### WiFi 连接失败
- 确保设备和电脑在同一网络
- 确保设备上已启用 ADB over WiFi
- 尝试重启 ADB 服务：`adb kill-server && adb start-server`

### 屏幕镜像不工作
- 某些设备可能不支持 `adb exec-out screencap`
- 应用会自动回退到 `adb shell screencap` + `adb pull`

### 日志文件删除失败
- 如果日志文件正在被占用，应用会自动重试
- 确保没有其他程序打开日志文件

### 构建失败
- 关闭正在运行的 Electron 进程
- 以管理员权限运行构建脚本
- 检查防火墙/杀毒软件是否阻止

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 👤 作者

ADB Device Manager Team

## 🙏 致谢

感谢以下开源项目：
- [Electron](https://www.electronjs.org/)
- [React](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Zustand](https://github.com/pmndrs/zustand)