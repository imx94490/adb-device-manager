import { exec, execFile, spawn, ChildProcess } from 'child_process'
import * as path from 'path'
import { app } from 'electron'
import { getConfig } from '../utils/config'

function escapeShellArg(arg: string): string {
  if (process.platform === 'win32') {
    if (/[^a-zA-Z0-9_.\-:,\\/]/.test(arg)) {
      return `"${arg.replace(/"/g, '\\"')}"`
    }
    return arg
  } else {
    return `'${arg.replace(/'/g, "'\\''")}'`
  }
}

export class AdbService {
  private static instance: AdbService
  private adbPath: string = 'adb'
  private adbAvailable: boolean = false

  private constructor() {}

  static getInstance(): AdbService {
    if (!AdbService.instance) {
      AdbService.instance = new AdbService()
    }
    return AdbService.instance
  }

  async init(): Promise<void> {
    const config = await getConfig()
    if (config.adbPath) {
      this.adbPath = config.adbPath
    }
  }

  async checkAdbAvailable(): Promise<boolean> {
    try {
      await this.executeCommand(['version'])
      this.adbAvailable = true
      return true
    } catch (e) {
      this.adbAvailable = false
      return false
    }
  }

  isAdbAvailable(): boolean {
    return this.adbAvailable
  }

  setAdbPath(adbPath: string): void {
    this.adbPath = adbPath
  }

  getAdbPath(): string {
    return this.adbPath
  }

  private buildCommand(args: string[], serial?: string): string {
    const cmdArgs = serial ? ['-s', serial, ...args] : args
    const adb = escapeShellArg(this.adbPath)
    const escapedArgs = cmdArgs.map(escapeShellArg).join(' ')
    return `${adb} ${escapedArgs}`
  }

  async executeCommand(args: string[], serial?: string): Promise<string> {
    const cmd = this.buildCommand(args, serial)

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('ADB command timeout'))
      }, 30000)

      exec(cmd, { encoding: 'buffer', windowsHide: true, timeout: 30000 }, (error: any, stdout: any, stderr: any) => {
        clearTimeout(timeout)
        if (error) {
          const errMsg = stderr?.toString() || error.message
          reject(new Error(errMsg))
          return
        }
        resolve(stdout.toString())
      })
    })
  }

  async executeCommandBuffer(args: string[], serial?: string): Promise<Buffer> {
    const cmd = this.buildCommand(args, serial)

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('ADB command timeout'))
      }, 30000)

      exec(cmd, { encoding: 'buffer', windowsHide: true, timeout: 30000 }, (error: any, stdout: any, stderr: any) => {
        clearTimeout(timeout)
        if (error) {
          const errMsg = stderr?.toString() || error.message
          reject(new Error(errMsg))
          return
        }
        resolve(stdout as Buffer)
      })
    })
  }

  spawnCommand(args: string[], serial?: string): ChildProcess {
    const cmdArgs = serial ? ['-s', serial, ...args] : args

    if (process.platform === 'win32') {
      const adb = escapeShellArg(this.adbPath)
      const escapedArgs = cmdArgs.map(escapeShellArg).join(' ')
      const fullCmd = `${adb} ${escapedArgs}`
      return spawn('cmd.exe', ['/c', fullCmd], {
        windowsHide: true,
        stdio: 'pipe',
      })
    } else {
      return spawn(this.adbPath, cmdArgs, {
        stdio: 'pipe',
      })
    }
  }
}
