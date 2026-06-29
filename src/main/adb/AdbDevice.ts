import { AdbService } from './AdbService'
import { DeviceInfo, DeviceState, LogcatOptions, KeyCode, ANDROID_KEYCODES } from '../../renderer/types'
import { EventEmitter } from 'events'
import { createWriteStream } from 'fs'
import * as path from 'path'

export class AdbDevice {
  private adbService: AdbService
  private logcatProcesses: Map<string, any> = new Map()
  private screenStreamIntervals: Map<string, NodeJS.Timeout> = new Map()

  constructor() {
    this.adbService = AdbService.getInstance()
  }

  async getDevices(): Promise<DeviceInfo[]> {
    try {
      const output = await this.adbService.executeCommand(['devices', '-l'])
      return this.parseDevicesOutput(output)
    } catch (e: any) {
      throw new Error(`Failed to get devices: ${e.message}`)
    }
  }

  private parseDevicesOutput(output: string): DeviceInfo[] {
    const devices: DeviceInfo[] = []
    const lines = output.trim().split('\n')

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      const parts = line.split(/\s+/)
      if (parts.length < 2) continue

      const serial = parts[0]
      const stateStr = parts[1]

      let state: DeviceState = 'unknown'
      if (stateStr === 'device') state = 'online'
      else if (stateStr === 'offline') state = 'offline'
      else if (stateStr === 'unauthorized') state = 'unauthorized'

      let model: string | undefined
      let manufacturer: string | undefined
      let product: string | undefined

      for (const part of parts) {
        if (part.startsWith('model:')) {
          model = part.substring(6)
        } else if (part.startsWith('manufacturer:')) {
          manufacturer = part.substring(13)
        } else if (part.startsWith('product:')) {
          product = part.substring(8)
        }
      }

      let ip: string | undefined
      let port: number | undefined
      let connectionType: 'usb' | 'wifi' = 'usb'

      if (serial.includes(':')) {
        const [ipPart, portPart] = serial.split(':')
        ip = ipPart
        port = parseInt(portPart, 10)
        connectionType = 'wifi'
      }

      const device: DeviceInfo = {
        serial,
        state,
        model,
        manufacturer,
        product,
        ip,
        port,
        connectionType,
      }

      devices.push(device)
    }

    return devices
  }

  async connectDevice(ip: string, port: number = 5555): Promise<string> {
    try {
      const result = await this.adbService.executeCommand(['connect', `${ip}:${port}`])
      return result.trim()
    } catch (e: any) {
      throw new Error(`Failed to connect: ${e.message}`)
    }
  }

  async disconnectDevice(ip: string, port: number = 5555): Promise<string> {
    try {
      const result = await this.adbService.executeCommand(['disconnect', `${ip}:${port}`])
      return result.trim()
    } catch (e: any) {
      throw new Error(`Failed to disconnect: ${e.message}`)
    }
  }

  async getDeviceProperties(serial: string): Promise<Record<string, string>> {
    try {
      const output = await this.adbService.executeCommand(['shell', 'getprop'], serial)
      const props: Record<string, string> = {}
      const lines = output.split('\n')
      for (const line of lines) {
        const match = line.match(/\[([^\]]+)\]:\s*\[([^\]]*)\]/)
        if (match) {
          props[match[1]] = match[2]
        }
      }
      return props
    } catch (e: any) {
      throw new Error(`Failed to get properties: ${e.message}`)
    }
  }

  async getDeviceInfo(serial: string): Promise<DeviceInfo> {
    const props = await this.getDeviceProperties(serial)
    const wmSize = await this.adbService.executeCommand(['shell', 'wm', 'size'], serial)
    const resolutionMatch = wmSize.match(/Physical size:\s*(\d+x\d+)/)

    let ip: string | undefined
    let port: number | undefined
    let connectionType: 'usb' | 'wifi' = 'usb'

    if (serial.includes(':')) {
      const [ipPart, portPart] = serial.split(':')
      ip = ipPart
      port = parseInt(portPart, 10)
      connectionType = 'wifi'
    }

    return {
      serial,
      state: 'online',
      model: props['ro.product.model'],
      androidVersion: props['ro.build.version.release'],
      resolution: resolutionMatch ? resolutionMatch[1] : undefined,
      manufacturer: props['ro.product.manufacturer'],
      product: props['ro.product.name'],
      ip,
      port,
      connectionType,
    }
  }

  async getScreenshot(serial: string): Promise<string> {
    try {
      const buffer = await this.adbService.executeCommandBuffer(
        ['exec-out', 'screencap', '-p'],
        serial
      )
      if (buffer && buffer.length > 100) {
        return `data:image/png;base64,${buffer.toString('base64')}`
      }
      throw new Error('Empty screenshot data from exec-out')
    } catch (e: any) {
      try {
        const os = require('os')
        const path = require('path')
        const fs = require('fs')
        const tmpDir = os.tmpdir()
        const localPath = path.join(tmpDir, `adb_screen_${Date.now()}.png`)
        const remotePath = '/sdcard/adb_screen_temp.png'

        await this.adbService.executeCommand(
          ['shell', 'screencap', '-p', remotePath],
          serial
        )
        await this.adbService.executeCommand(
          ['pull', remotePath, localPath],
          serial
        )
        const buffer = fs.readFileSync(localPath)
        try { fs.unlinkSync(localPath) } catch (_) {}
        try {
          this.adbService.executeCommand(['shell', 'rm', remotePath], serial).catch(() => {})
        } catch (_) {}

        if (buffer && buffer.length > 100) {
          return `data:image/png;base64,${buffer.toString('base64')}`
        }
        throw new Error('Empty screenshot data from pull method')
      } catch (e2: any) {
        throw new Error(`Screenshot failed: ${e.message}, fallback also failed: ${e2.message}`)
      }
    }
  }

  private screenStreamRunning = new Map<string, boolean>()

  startScreenStream(serial: string, fps: number = 2, callback: (frame: string) => void, onError?: (error: string) => void): void {
    this.stopScreenStream(serial)
    this.screenStreamRunning.set(serial, true)

    const interval = Math.floor(1000 / fps)
    let consecutiveErrors = 0
    const maxConsecutiveErrors = 15

    const captureFrame = async () => {
      if (!this.screenStreamRunning.get(serial)) return

      try {
        const frame = await this.getScreenshot(serial)
        consecutiveErrors = 0
        callback(frame)
      } catch (e: any) {
        consecutiveErrors++
        console.error('Screen stream error:', e.message)
        if (consecutiveErrors >= maxConsecutiveErrors) {
          console.error(`Screen stream stopped after ${maxConsecutiveErrors} consecutive errors`)
          this.stopScreenStream(serial)
          if (onError) {
            onError(`Stream stopped: ${e.message}`)
          }
          return
        }
      }

      if (this.screenStreamRunning.get(serial)) {
        const timer = setTimeout(captureFrame, interval)
        this.screenStreamIntervals.set(serial, timer)
      }
    }

    captureFrame()
  }

  stopScreenStream(serial: string): void {
    this.screenStreamRunning.set(serial, false)
    const timer = this.screenStreamIntervals.get(serial)
    if (timer) {
      clearTimeout(timer)
      this.screenStreamIntervals.delete(serial)
    }
  }

  async inputTap(serial: string, x: number, y: number): Promise<void> {
    try {
      await this.adbService.executeCommand(
        ['shell', 'input', 'tap', x.toString(), y.toString()],
        serial
      )
    } catch (e: any) {
      throw new Error(`Failed to input tap: ${e.message}`)
    }
  }

  async inputSwipe(
    serial: string,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    duration: number = 300
  ): Promise<void> {
    try {
      await this.adbService.executeCommand(
        ['shell', 'input', 'swipe', x1.toString(), y1.toString(), x2.toString(), y2.toString(), duration.toString()],
        serial
      )
    } catch (e: any) {
      throw new Error(`Failed to input swipe: ${e.message}`)
    }
  }

  async inputKeyEvent(serial: string, keyCode: KeyCode | number): Promise<void> {
    const code = typeof keyCode === 'string' ? ANDROID_KEYCODES[keyCode] : keyCode
    if (!code) throw new Error(`Invalid key code: ${keyCode}`)

    try {
      await this.adbService.executeCommand(
        ['shell', 'input', 'keyevent', code.toString()],
        serial
      )
    } catch (e: any) {
      throw new Error(`Failed to input key event: ${e.message}`)
    }
  }

  async installApk(serial: string, apkPath: string, onProgress?: (msg: string) => void): Promise<string> {
    return new Promise((resolve, reject) => {
      const child = this.adbService.spawnCommand(['install', '-r', apkPath], serial)

      let output = ''

      if (child.stdout) {
        child.stdout.on('data', (data: Buffer) => {
          const msg = data.toString()
          output += msg
          if (onProgress) onProgress(msg)
        })
      }

      if (child.stderr) {
        child.stderr.on('data', (data: Buffer) => {
          const msg = data.toString()
          output += msg
          if (onProgress) onProgress(msg)
        })
      }

      child.on('close', (code: number) => {
        if (code === 0) {
          resolve(output.trim())
        } else {
          reject(new Error(output.trim() || `Install failed with code ${code}`))
        }
      })

      child.on('error', (err: Error) => {
        reject(err)
      })
    })
  }

  startLogcat(serial: string, options: LogcatOptions = {}): EventEmitter {
    this.stopLogcat(serial)

    const emitter = new EventEmitter()
    const args: string[] = ['logcat', '-v', 'time']

    const filters: string[] = []

    if (options.tag && options.tag.trim()) {
      const tag = options.tag.trim()
      if (options.level) {
        filters.push(`${tag}:${options.level}`)
      } else {
        filters.push(`${tag}:V`)
      }
      filters.push('*:S')
    } else if (options.level && options.level !== 'V') {
      filters.push(`*:${options.level}`)
    }

    if (filters.length > 0) {
      args.push(...filters)
    }

    const child = this.adbService.spawnCommand(args, serial)
    this.logcatProcesses.set(serial, child)

    let writeStream: any = null
    if (options.outputPath && options.outputFileName) {
      const filePath = path.join(options.outputPath, options.outputFileName)
      writeStream = createWriteStream(filePath, { flags: 'w' })
    }

    if (child.stdout) {
      child.stdout.on('data', (data: Buffer) => {
        const text = data.toString()
        emitter.emit('data', text)
        if (writeStream) {
          writeStream.write(text)
        }
      })
    }

    if (child.stderr) {
      child.stderr.on('data', (data: Buffer) => {
        const text = data.toString()
        emitter.emit('error', text)
      })
    }

    child.on('close', () => {
      emitter.emit('close')
      if (writeStream) {
        writeStream.end()
      }
      this.logcatProcesses.delete(serial)
    })

    child.on('error', (err: Error) => {
      emitter.emit('error', err.message)
    })

    return emitter
  }

  stopLogcat(serial: string): void {
    const child = this.logcatProcesses.get(serial)
    if (!child) return

    if (child.stdout) {
      try { child.stdout.destroy() } catch (_) {}
    }
    if (child.stderr) {
      try { child.stderr.destroy() } catch (_) {}
    }
    if (child.stdin) {
      try { child.stdin.destroy() } catch (_) {}
    }

    if (!child.killed) {
      if (process.platform === 'win32') {
        try {
          const pid = child.pid
          if (pid) {
            const { exec } = require('child_process')
            exec(`taskkill /F /T /PID ${pid}`, (err: any) => {
              if (err) {
                child.kill('SIGKILL')
              }
            })
          } else {
            child.kill('SIGKILL')
          }
        } catch (_) {
          child.kill('SIGKILL')
        }
      } else {
        child.kill('SIGTERM')
        setTimeout(() => {
          if (!child.killed) {
            child.kill('SIGKILL')
          }
        }, 2000)
      }
    }

    this.logcatProcesses.delete(serial)
  }

  stopAllStreams(): void {
    for (const serial of this.screenStreamIntervals.keys()) {
      this.stopScreenStream(serial)
    }
    for (const serial of this.logcatProcesses.keys()) {
      this.stopLogcat(serial)
    }
  }
}

export const adbDevice = new AdbDevice()
