# ADB 设备管理系统 - 技术架构文档

## 1. 技术栈选型

### 1.1 整体架构
采用 **Electron + React + TypeScript** 技术栈，构建跨平台桌面应用。

```
┌─────────────────────────────────────────────────┐
│                  Electron 主进程                  │
│  (Node.js 环境 - ADB命令执行、文件系统、IPC)       │
├─────────────────────────────────────────────────┤
│                   IPC 通信层                      │
│  (contextBridge / ipcMain / ipcRenderer)         │
├─────────────────────────────────────────────────┤
│                  渲染进程 (React)                 │
│  (UI 界面、状态管理、用户交互)                     │
└─────────────────────────────────────────────────┘
```

### 1.2 技术清单

| 类别 | 技术 | 版本 | 用途 |
|------|------|------|------|
| 桌面框架 | Electron | ^30.x | 桌面应用打包与运行时 |
| 构建工具 | Vite | ^5.x | 前端构建与开发服务器 |
| 前端框架 | React | ^18.x | UI 组件化开发 |
| 语言 | TypeScript | ^5.x | 类型安全 |
| 样式 | Tailwind CSS | ^3.x | 原子化 CSS 框架 |
| 状态管理 | Zustand | ^4.x | 轻量级状态管理 |
| 图标 | Lucide React | ^0.x | 现代图标库 |
| 打包 | electron-builder | ^24.x | 生成 .exe 安装包 |

---

## 2. 项目目录结构

```
adb-device-manager/
├── .trae/
│   └── documents/          # 项目文档
├── src/
│   ├── main/               # Electron 主进程
│   │   ├── index.ts        # 主进程入口
│   │   ├── adb/            # ADB 命令服务
│   │   │   ├── AdbService.ts
│   │   │   ├── AdbDevice.ts
│   │   │   └── AdbCommands.ts
│   │   ├── ipc/            # IPC 通信处理
│   │   │   ├── deviceIpc.ts
│   │   │   ├── screenIpc.ts
│   │   │   ├── apkIpc.ts
│   │   │   └── logIpc.ts
│   │   └── utils/          # 工具函数
│   │       ├── fs.ts
│   │       └── config.ts
│   ├── preload/            # 预加载脚本
│   │   └── index.ts        # contextBridge 暴露 API
│   └── renderer/           # 渲染进程 (React)
│       ├── main.tsx        # React 入口
│       ├── App.tsx         # 根组件
│       ├── components/     # UI 组件
│       │   ├── layout/     # 布局组件
│       │   ├── device/     # 设备相关组件
│       │   ├── screen/     # 屏幕投射组件
│       │   ├── apk/        # APK 安装组件
│       │   ├── log/        # 日志管理组件
│       │   └── common/     # 通用组件
│       ├── stores/         # 状态管理
│       │   ├── deviceStore.ts
│       │   └── appStore.ts
│       ├── hooks/          # 自定义 Hooks
│       ├── types/          # TypeScript 类型定义
│       ├── styles/         # 全局样式
│       └── utils/          # 前端工具函数
├── public/                 # 静态资源
├── electron-builder.yml    # electron-builder 配置
├── vite.config.ts          # Vite 配置
├── tsconfig.json           # TypeScript 配置
├── tailwind.config.js      # Tailwind 配置
├── package.json
└── README.md
```

---

## 3. 核心模块设计

### 3.1 ADB 服务层 (主进程)

#### 3.1.1 AdbService - ADB 基础服务
```typescript
// 核心方法
- executeCommand(command: string, args: string[]): Promise<string>
- executeCommandStream(command: string, args: string[]): EventEmitter
- getAdbPath(): Promise<string>
- checkAdbAvailable(): Promise<boolean>
```

#### 3.1.2 AdbDevice - 设备操作封装
```typescript
// 设备信息
interface DeviceInfo {
  serial: string;          // 设备序列号
  state: DeviceState;      // 设备状态
  model?: string;          // 设备型号
  androidVersion?: string; // Android 版本
  resolution?: string;     // 屏幕分辨率
  ip?: string;             // IP 地址 (WiFi设备)
  connectionType: 'usb' | 'wifi';
}

// 核心方法
- getDevices(): Promise<DeviceInfo[]>
- connectDevice(ip: string, port: number): Promise<string>
- disconnectDevice(ip: string, port: number): Promise<string>
- getDeviceProperties(serial: string): Promise<Record<string, string>>
- getDeviceScreenshot(serial: string): Promise<Buffer>
- inputTap(serial: string, x: number, y: number): Promise<void>
- inputSwipe(serial: string, x1: number, y1: number, x2: number, y2: number, duration: number): Promise<void>
- inputKeyEvent(serial: string, keyCode: number): Promise<void>
- installApk(serial: string, apkPath: string): Promise<string>
- startLogcat(serial: string, options: LogcatOptions): EventEmitter
- stopLogcat(serial: string): void
```

#### 3.1.3 AdbCommands - 命令常量
定义所有 ADB 命令模板，集中管理。

---

### 3.2 IPC 通信层

#### 3.2.1 通信通道设计

| 通道名 | 方向 | 用途 |
|--------|------|------|
| `device:list` | Renderer → Main | 获取设备列表 |
| `device:connect` | Renderer → Main | 连接 WiFi 设备 |
| `device:disconnect` | Renderer → Main | 断开设备 |
| `device:refresh` | Main → Renderer | 设备列表更新通知 |
| `screen:capture` | Renderer → Main | 请求截图 |
| `screen:stream-start` | Renderer → Main | 开始屏幕流 |
| `screen:stream-data` | Main → Renderer | 屏幕帧数据推送 |
| `screen:tap` | Renderer → Main | 模拟点击 |
| `screen:swipe` | Renderer → Main | 模拟滑动 |
| `screen:key` | Renderer → Main | 模拟按键 |
| `apk:install` | Renderer → Main | 安装 APK |
| `apk:progress` | Main → Renderer | 安装进度 |
| `log:start` | Renderer → Main | 开始抓取日志 |
| `log:stop` | Renderer → Main | 停止抓取日志 |
| `log:data` | Main → Renderer | 日志数据推送 |
| `log:delete` | Renderer → Main | 删除日志文件 |
| `config:get` | Renderer → Main | 获取配置 |
| `config:set` | Renderer → Main | 设置配置 |

#### 3.2.2 Preload 脚本
通过 `contextBridge` 安全暴露 API 给渲染进程：

```typescript
// window.api 接口定义
interface ElectronAPI {
  device: {
    getDevices: () => Promise<DeviceInfo[]>;
    connect: (ip: string, port: number) => Promise<string>;
    disconnect: (serial: string) => Promise<string>;
    onRefresh: (callback: (devices: DeviceInfo[]) => void) => void;
  };
  screen: {
    capture: (serial: string) => Promise<string>; // base64
    startStream: (serial: string, fps: number) => void;
    stopStream: (serial: string) => void;
    onFrame: (callback: (frame: string) => void) => void;
    tap: (serial: string, x: number, y: number) => Promise<void>;
    swipe: (serial: string, ...args: number[]) => Promise<void>;
    keyEvent: (serial: string, keyCode: number) => Promise<void>;
  };
  apk: {
    install: (serial: string, filePath: string) => Promise<string>;
    onProgress: (callback: (progress: number) => void) => void;
  };
  log: {
    start: (serial: string, options: LogOptions) => Promise<string>;
    stop: (serial: string) => void;
    onData: (callback: (data: string) => void) => void;
    delete: (filePath: string) => Promise<boolean>;
    getFiles: () => Promise<LogFile[]>;
  };
  config: {
    get: () => Promise<AppConfig>;
    set: (config: Partial<AppConfig>) => Promise<void>;
  };
}
```

---

### 3.3 前端状态管理

使用 Zustand 管理应用状态：

```typescript
// deviceStore - 设备状态
interface DeviceState {
  devices: DeviceInfo[];
  selectedDevice: DeviceInfo | null;
  isRefreshing: boolean;
  error: string | null;
  
  fetchDevices: () => Promise<void>;
  selectDevice: (device: DeviceInfo | null) => void;
  connectDevice: (ip: string, port: number) => Promise<void>;
  disconnectDevice: (serial: string) => Promise<void>;
}

// appStore - 应用状态
interface AppState {
  theme: 'dark' | 'light';
  config: AppConfig;
  showSettings: boolean;
  
  setTheme: (theme: 'dark' | 'light') => void;
  toggleSettings: () => void;
  loadConfig: () => Promise<void>;
  saveConfig: (config: Partial<AppConfig>) => Promise<void>;
}
```

---

### 3.4 屏幕投射实现策略

#### 方案一：scrcpy（推荐，优先使用）
- 低延迟（30-100ms）
- 高帧率（30-60fps）
- 需要设备开启 USB 调试
- 通过 H.264 视频流传输

#### 方案二：adb screencap + 轮询（降级方案）
- 兼容性最好，所有设备支持
- 延迟较高（500ms-2s）
- 帧率低（1-5fps）
- 实现简单

```typescript
// 屏幕流实现思路
1. 主进程定时执行 adb exec-out screencap -p
2. 将 PNG 图片转为 base64
3. 通过 IPC 推送到渲染进程
4. 渲染进程更新 <img> 或 <canvas>
5. 用户点击时计算坐标比例，发送 adb shell input tap
```

---

## 4. UI 组件架构

### 4.1 页面路由
采用单页面 + 状态切换模式（非多窗口）：

```
App
├── Sidebar (侧边栏导航)
├── MainContent
│   ├── DeviceListView (设备列表页)
│   ├── DeviceDetailView (设备详情页)
│   │   ├── ScreenViewer (屏幕投射)
│   │   ├── ApkInstaller (APK安装)
│   │   └── LogViewer (日志查看)
│   └── SettingsView (设置页)
└── StatusBar (状态栏)
```

### 4.2 核心组件

| 组件名 | 功能 |
|--------|------|
| `DeviceCard` | 设备卡片，展示设备信息与快捷操作 |
| `DeviceList` | 设备列表，支持搜索、筛选 |
| `ScreenViewer` | 屏幕投射显示区域，支持点击/滑动交互 |
| `ApkDropZone` | APK 拖拽安装区域 |
| `LogViewer` | 日志实时查看器，支持过滤、高亮 |
| `ConnectDialog` | 连接设备对话框 |
| `SettingsPanel` | 设置面板 |

---

## 5. 数据持久化

### 5.1 配置存储
使用 Electron 的 `app.getPath('userData')` 目录存储配置：

```typescript
interface AppConfig {
  adbPath: string;
  defaultPort: number;
  autoRefresh: boolean;
  refreshInterval: number; // 秒
  theme: 'dark' | 'light';
  logOutputPath: string;
  logFileNamePattern: string;
  savedDevices: SavedDevice[];
}

interface SavedDevice {
  ip: string;
  port: number;
  alias?: string;
  lastConnected: number;
}
```

### 5.2 存储格式
JSON 文件存储，路径：`%APPDATA%/ADBDeviceManager/config.json`

---

## 6. 打包与发布

### 6.1 electron-builder 配置
- 应用名称：ADB Device Manager
- 应用 ID：com.adbmanager.dev
- 输出格式：
  - NSIS 安装包 (.exe)
  - 便携版 (portable .exe)
- 图标：自定义应用图标
- 产品版本：1.0.0

### 6.2 打包命令
```bash
npm run build        # 构建前端
npm run dist         # 打包为安装包
npm run dist:portable # 打包便携版
```

---

## 7. 性能优化策略

1. **设备列表刷新防抖**：避免频繁刷新导致的性能问题
2. **屏幕帧节流**：根据网络状况自动调整帧率
3. **日志虚拟滚动**：日志列表使用虚拟滚动，避免大量 DOM
4. **IPC 数据压缩**：大图传输时进行压缩
5. **懒加载**：非核心组件按需加载

---

## 8. 错误处理策略

1. **ADB 不可用检测**：启动时检测 ADB，不可用时提示用户配置
2. **命令执行超时**：所有 ADB 命令设置超时时间
3. **友好错误提示**：将技术错误转化为用户易懂的提示
4. **操作日志**：记录所有操作和错误，便于排查问题
