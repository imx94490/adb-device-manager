import { useState, useEffect, useRef } from 'react'
import {
  Play,
  Pause,
  Trash2,
  FolderOpen,
  FileText,
  Search,
  Filter,
  Download,
  Clock,
  TrendingUp,
  AlertTriangle,
  XCircle,
  Info,
} from 'lucide-react'
import { DeviceInfo, LogFile, LogcatOptions } from '../../types'

interface LogManagerProps {
  device: DeviceInfo
}

const LogManager = ({ device }: LogManagerProps) => {
  const [isLogging, setIsLogging] = useState(false)
  const [logData, setLogData] = useState<string[]>([])
  const [logFiles, setLogFiles] = useState<LogFile[]>([])
  const [logLevel, setLogLevel] = useState<'V' | 'D' | 'I' | 'W' | 'E' | 'F'>('V')
  const [tagFilter, setTagFilter] = useState('')
  const [searchText, setSearchText] = useState('')
  const [autoScroll, setAutoScroll] = useState(true)
  const [currentOutputFile, setCurrentOutputFile] = useState<string>('')
  const logContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadLogFiles()
  }, [])

  useEffect(() => {
    const handleData = (serial: string, data: string) => {
      if (serial === device.serial) {
        const lines = data.split('\n').filter((l) => l.trim())
        setLogData((prev) => [...prev, ...lines].slice(-2000))
      }
    }

    const handleClose = (serial: string) => {
      if (serial === device.serial) {
        setIsLogging(false)
        loadLogFiles()
      }
    }

    const unsubData = (window as any).api.log.onData(handleData)
    const unsubClose = (window as any).api.log.onClose(handleClose)

    return () => {
      unsubData()
      unsubClose()
    }
  }, [device.serial])

  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }, [logData, autoScroll])

  const loadLogFiles = async () => {
    const result = await (window as any).api.log.getFiles()
    if (result.success) {
      setLogFiles(result.data)
    }
  }

  const startLogging = async () => {
    const options: LogcatOptions = {
      level: logLevel,
      tag: tagFilter || undefined,
    }

    const result = await (window as any).api.log.start(device.serial, options)
    if (result.success) {
      setIsLogging(true)
      setCurrentOutputFile(result.data.outputPath)
      setLogData([])
    }
  }

  const stopLogging = async () => {
    await (window as any).api.log.stop(device.serial)
    setIsLogging(false)
    loadLogFiles()
  }

  const deleteLogFile = async (filePath: string) => {
    const result = await (window as any).api.log.deleteFile(filePath)
    if (result.success) {
      loadLogFiles()
    }
  }

  const openLogFolder = async (filePath: string) => {
    await (window as any).api.log.openFolder(filePath)
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const getLogLevelColor = (line: string) => {
    if (line.includes(' E/')) return 'log-error'
    if (line.includes(' W/')) return 'log-warning'
    if (line.includes(' I/')) return 'log-info'
    if (line.includes(' D/')) return 'log-debug'
    if (line.includes(' F/')) return 'log-fatal'
    if (line.includes(' V/')) return 'log-verbose'
    return 'text-gray-400'
  }

  const getLogLevelFromLine = (line: string): string | null => {
    const match = line.match(/\/(\w)\s/)
    if (match) return match[1]
    if (line.includes(' E/')) return 'E'
    if (line.includes(' W/')) return 'W'
    if (line.includes(' I/')) return 'I'
    if (line.includes(' D/')) return 'D'
    if (line.includes(' F/')) return 'F'
    if (line.includes(' V/')) return 'V'
    return null
  }

  const getTagFromLine = (line: string): string | null => {
    const match = line.match(/\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}\.\d{3}\s+\d+\s+\d+\s+[VDIWEF]\s+([^:]+):/)
    if (match) return match[1].trim()
    const simpleMatch = line.match(/[VDIWEF]\/([^(]+)\(/)
    if (simpleMatch) return simpleMatch[1].trim()
    return null
  }

  const levelPriority: Record<string, number> = {
    V: 0,
    D: 1,
    I: 2,
    W: 3,
    E: 4,
    F: 5,
  }

  const filteredLogs = logData.filter((line) => {
    const level = getLogLevelFromLine(line)
    if (level && levelPriority[level] !== undefined && levelPriority[level] < levelPriority[logLevel]) {
      return false
    }

    if (tagFilter.trim()) {
      const tag = getTagFromLine(line)
      if (!tag || !tag.toLowerCase().includes(tagFilter.trim().toLowerCase())) {
        return false
      }
    }

    if (searchText && !line.toLowerCase().includes(searchText.toLowerCase())) {
      return false
    }

    return true
  })

  const levels = [
    { value: 'V', label: 'Verbose' },
    { value: 'D', label: 'Debug' },
    { value: 'I', label: 'Info' },
    { value: 'W', label: 'Warning' },
    { value: 'E', label: 'Error' },
    { value: 'F', label: 'Fatal' },
  ]

  return (
    <div className="w-full h-full flex">
      {/* Log Viewer */}
      <div className="flex-1 p-6 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyber-green/20 to-cyber-accent/20 border border-cyber-green/30 flex items-center justify-center">
              <FileText className="w-5 h-5 text-cyber-green" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">日志抓取</h2>
              <p className="text-xs text-gray-500">实时查看和保存设备日志</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isLogging ? (
              <button onClick={stopLogging} className="btn-red text-sm">
                <Pause className="w-4 h-4 inline mr-1.5" />
                停止抓取
              </button>
            ) : (
              <button onClick={startLogging} className="btn-green text-sm">
                <Play className="w-4 h-4 inline mr-1.5" />
                开始抓取
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-4">
          <select
            value={logLevel}
            onChange={(e) => setLogLevel(e.target.value as any)}
            className="input-cyber text-xs w-32 py-1.5"
            disabled={isLogging}
          >
            {levels.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            placeholder="Tag 过滤"
            className="input-cyber text-xs w-40 py-1.5"
            disabled={isLogging}
          />

          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="搜索日志内容..."
              className="input-cyber text-xs pl-8 py-1.5"
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-gray-400">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="accent-cyber-accent"
            />
            自动滚动
          </label>
        </div>

        {/* Log Display */}
        <div
          ref={logContainerRef}
          className="flex-1 bg-black/60 rounded-xl border border-cyber-border/50 p-3 overflow-y-auto font-mono text-xs leading-5"
        >
          {filteredLogs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-600">
              <FileText className="w-10 h-10 mb-3" />
              <p>{isLogging ? '等待日志输出...' : '点击开始抓取日志'}</p>
            </div>
          ) : (
            filteredLogs.map((line, index) => (
              <div key={index} className={`${getLogLevelColor(line)} whitespace-pre-wrap break-all`}>
                {line}
              </div>
            ))
          )}
        </div>

        {isLogging && currentOutputFile && (
          <div className="mt-3 text-xs text-gray-500 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>正在写入: {currentOutputFile}</span>
          </div>
        )}
      </div>

      {/* Log Files */}
      <div className="w-80 border-l border-cyber-border/50 bg-cyber-surface/30 p-4 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-cyber-accent" />
            历史日志
          </h3>
          <button
            onClick={loadLogFiles}
            className="text-xs text-gray-400 hover:text-white"
          >
            刷新
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2">
          {logFiles.length === 0 ? (
            <div className="text-center py-10">
              <FileText className="w-8 h-8 mx-auto mb-2 text-gray-600" />
              <p className="text-xs text-gray-500">暂无日志文件</p>
            </div>
          ) : (
            logFiles.map((file) => (
              <div
                key={file.path}
                className="p-3 rounded-lg bg-cyber-bg/50 border border-cyber-border/50 hover:border-cyber-accent/30 transition-colors group"
              >
                <div className="flex items-start justify-between mb-2">
                  <p className="text-xs text-white font-mono truncate flex-1 pr-2">
                    {file.name}
                  </p>
                </div>
                <div className="flex items-center justify-between text-[11px] text-gray-500 mb-2">
                  <span>{formatSize(file.size)}</span>
                  <span>{formatTime(file.createdAt)}</span>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openLogFolder(file.path)}
                    className="flex-1 px-2 py-1 rounded text-[11px] text-gray-400 hover:text-cyber-accent hover:bg-cyber-accent/10 flex items-center justify-center gap-1"
                  >
                    <FolderOpen className="w-3 h-3" />
                    打开
                  </button>
                  <button
                    onClick={() => deleteLogFile(file.path)}
                    className="flex-1 px-2 py-1 rounded text-[11px] text-gray-400 hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    删除
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default LogManager
