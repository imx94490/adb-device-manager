import { useState, useEffect, useRef } from 'react'
import {
  Play,
  Pause,
  Camera,
  Maximize2,
  Minimize2,
  Power,
  Home,
  CornerUpLeft,
  Menu,
  Volume2,
  VolumeX,
  RefreshCw,
  Smartphone,
  AlertTriangle,
  X,
} from 'lucide-react'
import { DeviceInfo, KeyCode } from '../../types'

interface ScreenViewerProps {
  device: DeviceInfo
}

const ScreenViewer = ({ device }: ScreenViewerProps) => {
  const [isStreaming, setIsStreaming] = useState(false)
  const [currentFrame, setCurrentFrame] = useState<string>('')
  const [fps, setFps] = useState(5)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [resolution, setResolution] = useState({ width: 0, height: 0 })
  const [actualFps, setActualFps] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0, time: 0 })
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const frameCountRef = useRef(0)
  const fpsCounterRef = useRef<NodeJS.Timeout | null>(null)
  const lastFrameTimeRef = useRef(0)

  const clearLoadingTimeout = () => {
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current)
      loadingTimeoutRef.current = null
    }
  }

  const startLoadingTimeout = (duration: number = 10000) => {
    clearLoadingTimeout()
    loadingTimeoutRef.current = setTimeout(() => {
      setLoading(false)
      setError('Connection timeout, please check if the device is connected')
      if (isStreaming) {
        stopStream()
      }
    }, duration)
  }

  useEffect(() => {
    const handleFrame = (serial: string, frame: string) => {
      if (serial === device.serial) {
        setCurrentFrame(frame)
        setLoading(false)
        setError('')
        clearLoadingTimeout()
        frameCountRef.current++
        lastFrameTimeRef.current = Date.now()
      }
    }

    const handleStreamError = (serial: string, errMsg: string) => {
      if (serial === device.serial) {
        if (errMsg.includes('stopped')) {
          setError(errMsg)
          setIsStreaming(false)
          setLoading(false)
          clearLoadingTimeout()
        }
      }
    }

    const unsubFrame = (window as any).api.screen.onFrame(handleFrame)
    const unsubError = (window as any).api.screen.onStreamError(handleStreamError)

    return () => {
      unsubFrame()
      unsubError()
      clearLoadingTimeout()
      ;(window as any).api.screen.stopStream(device.serial)
    }
  }, [device.serial, isStreaming])

  useEffect(() => {
    if (isStreaming) {
      fpsCounterRef.current = setInterval(() => {
        setActualFps(frameCountRef.current)
        frameCountRef.current = 0
      }, 1000)
    } else {
      if (fpsCounterRef.current) {
        clearInterval(fpsCounterRef.current)
        fpsCounterRef.current = null
      }
      setActualFps(0)
    }
    return () => {
      if (fpsCounterRef.current) {
        clearInterval(fpsCounterRef.current)
      }
    }
  }, [isStreaming])

  const startStream = async () => {
    setError('')
    setLoading(true)
    frameCountRef.current = 0
    startLoadingTimeout(15000)

    try {
      const firstFrameResult = await (window as any).api.screen.capture(device.serial)
      if (firstFrameResult.success) {
        setCurrentFrame(firstFrameResult.data)
        setLoading(false)
        clearLoadingTimeout()
      } else {
        throw new Error(firstFrameResult.error || 'Failed to get first frame')
      }

      ;(window as any).api.screen.startStream(device.serial, fps)
      setIsStreaming(true)
    } catch (e: any) {
      setLoading(false)
      clearLoadingTimeout()
      setError(e.message || 'Failed to start screen stream')
      setIsStreaming(false)
    }
  }

  const stopStream = () => {
    ;(window as any).api.screen.stopStream(device.serial)
    setIsStreaming(false)
    clearLoadingTimeout()
  }

  const captureScreen = async () => {
    setError('')
    setLoading(true)
    startLoadingTimeout(10000)

    try {
      const result = await (window as any).api.screen.capture(device.serial)
      if (result.success) {
        setCurrentFrame(result.data)
        setError('')
      } else {
        throw new Error(result.error || 'Screenshot failed')
      }
    } catch (e: any) {
      setError(e.message || 'Screenshot failed')
    } finally {
      setLoading(false)
      clearLoadingTimeout()
    }
  }

  const getRelativePosition = (e: React.MouseEvent) => {
    const target = e.currentTarget as HTMLDivElement
    const rect = target.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * resolution.width
    const y = ((e.clientY - rect.top) / rect.height) * resolution.height
    return { x: Math.round(x), y: Math.round(y) }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isStreaming || !resolution.width) return
    isDragging.current = true
    const pos = getRelativePosition(e)
    dragStart.current = { x: pos.x, y: pos.y, time: Date.now() }
  }

  const handleMouseUp = async (e: React.MouseEvent) => {
    if (!isDragging.current || !isStreaming) return
    isDragging.current = false

    const pos = getRelativePosition(e)
    const dx = pos.x - dragStart.current.x
    const dy = pos.y - dragStart.current.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    const duration = Date.now() - dragStart.current.time

    if (distance < 10 && duration < 300) {
      await (window as any).api.screen.tap(device.serial, pos.x, pos.y)
    } else if (distance > 20) {
      await (window as any).api.screen.swipe(
        device.serial,
        dragStart.current.x,
        dragStart.current.y,
        pos.x,
        pos.y,
        Math.min(duration, 500)
      )
    }
  }

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    setResolution({ width: img.naturalWidth, height: img.naturalHeight })
  }

  const sendKeyEvent = async (keyCode: KeyCode | number) => {
    await (window as any).api.screen.keyEvent(device.serial, keyCode)
  }

  const quickActions = [
    { icon: Home, label: 'Home', keyCode: 'HOME' as KeyCode },
    { icon: CornerUpLeft, label: '返回', keyCode: 'BACK' as KeyCode },
    { icon: Menu, label: '菜单', keyCode: 'MENU' as KeyCode },
    { icon: Volume2, label: '音量+', keyCode: 'VOLUME_UP' as KeyCode },
    { icon: VolumeX, label: '音量-', keyCode: 'VOLUME_DOWN' as KeyCode },
    { icon: Power, label: '电源', keyCode: 'POWER' as KeyCode },
  ]

  return (
    <div className="w-full h-full flex">
      {/* Screen Area */}
      <div className="flex-1 p-6 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-cyber-accent" />
            屏幕控制
          </h2>
          <div className="flex items-center gap-2">
            <select
              value={fps}
              onChange={(e) => setFps(Number(e.target.value))}
              className="input-cyber text-xs w-24 py-1"
              disabled={isStreaming}
            >
              <option value={1}>1 FPS</option>
              <option value={2}>2 FPS</option>
              <option value={5}>5 FPS</option>
              <option value={10}>10 FPS</option>
              <option value={15}>15 FPS</option>
              <option value={20}>20 FPS</option>
            </select>
            <button onClick={captureScreen} className="btn-cyber text-sm" disabled={loading}>
              <Camera className="w-4 h-4 inline mr-1.5" />
              截图
            </button>
            {isStreaming ? (
              <button onClick={stopStream} className="btn-red text-sm">
                <Pause className="w-4 h-4 inline mr-1.5" />
                停止
              </button>
            ) : (
              <button onClick={startStream} className="btn-green text-sm" disabled={loading}>
                <Play className="w-4 h-4 inline mr-1.5" />
                实时投射
              </button>
            )}
          </div>
        </div>

        <div
          ref={containerRef}
          className="flex-1 flex items-center justify-center bg-black/50 rounded-xl border border-cyber-border/50 overflow-hidden relative"
        >
          {loading && !isStreaming && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-20 flex-col gap-3">
              <RefreshCw className="w-10 h-10 text-cyber-accent animate-spin" />
              <p className="text-sm text-gray-400">Connecting...</p>
            </div>
          )}

          {error && !loading && !isStreaming && (
            <div className="absolute top-4 left-4 right-4 z-20">
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-red-400 font-medium">Error</p>
                  <p className="text-xs text-red-300/70 mt-1">{error}</p>
                </div>
                <button
                  onClick={() => setError('')}
                  className="text-red-400 hover:text-red-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {currentFrame ? (
            <div
              className="relative max-w-full max-h-full cursor-crosshair select-none"
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onMouseLeave={() => { isDragging.current = false }}
            >
              <img
                src={currentFrame}
                alt="Device Screen"
                onLoad={handleImageLoad}
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
                draggable={false}
              />
              {isStreaming && (
                <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/70 px-3 py-1.5 rounded-md">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xs text-white font-medium">LIVE</span>
                  </div>
                  <div className="w-px h-4 bg-gray-500" />
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-green-400 font-mono">{actualFps}</span>
                    <span className="text-xs text-gray-400">FPS</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-cyber-surface flex items-center justify-center border border-cyber-border">
                <Smartphone className="w-10 h-10 text-gray-600" />
              </div>
              <p className="text-gray-500 mb-2">Click the button below to start screen mirroring</p>
              <p className="text-xs text-gray-600">Supports tap and swipe gestures</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-4 flex items-center justify-center gap-3">
          {quickActions.map((action) => (
            <button
              key={action.keyCode}
              onClick={() => sendKeyEvent(action.keyCode)}
              className="w-12 h-12 rounded-xl bg-cyber-surface border border-cyber-border flex flex-col items-center justify-center hover:border-cyber-accent/50 hover:bg-cyber-accent/5 transition-all group"
              title={action.label}
            >
              <action.icon className="w-5 h-5 text-gray-400 group-hover:text-cyber-accent transition-colors" />
            </button>
          ))}
        </div>
      </div>

      {/* Info Panel */}
      <div className="w-72 border-l border-cyber-border/50 p-4 bg-cyber-surface/30">
        <h3 className="text-sm font-semibold text-white mb-4">设备信息</h3>
        <div className="space-y-3 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-500">序列号</span>
            <span className="text-gray-300 font-mono">{device.serial}</span>
          </div>
          {device.model && (
            <div className="flex justify-between">
              <span className="text-gray-500">型号</span>
              <span className="text-gray-300">{device.model}</span>
            </div>
          )}
          {device.androidVersion && (
            <div className="flex justify-between">
              <span className="text-gray-500">Android</span>
              <span className="text-gray-300">{device.androidVersion}</span>
            </div>
          )}
          {device.resolution && (
            <div className="flex justify-between">
              <span className="text-gray-500">分辨率</span>
              <span className="text-gray-300">{device.resolution}</span>
            </div>
          )}
          {device.ip && (
            <div className="flex justify-between">
              <span className="text-gray-500">IP 地址</span>
              <span className="text-cyber-accent font-mono">{device.ip}:{device.port}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-500">连接方式</span>
            <span className="text-gray-300">
              {device.connectionType === 'wifi' ? 'WiFi' : 'USB'}
            </span>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-cyber-border/50">
          <h3 className="text-sm font-semibold text-white mb-3">操作提示</h3>
          <ul className="text-xs text-gray-500 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-cyber-accent">•</span>
              <span>点击屏幕模拟触摸</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyber-accent">•</span>
              <span>拖拽屏幕模拟滑动</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyber-accent">•</span>
              <span>FPS 越高延迟越低</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default ScreenViewer
