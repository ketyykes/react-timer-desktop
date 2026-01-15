import { ipcMain, BrowserWindow } from 'electron'
import { IPC_CHANNELS } from '../../shared/types'
import { TimerService } from '../timer/TimerService'

/**
 * 計時器 IPC 處理器
 * 負責主程序與渲染程序之間的計時器通訊
 */
export class TimerIpcHandler {
  private timerService: TimerService
  private mainWindow: BrowserWindow | null = null

  constructor(timerService: TimerService) {
    this.timerService = timerService
  }

  /**
   * 設定主視窗
   */
  setMainWindow(window: BrowserWindow | null): void {
    this.mainWindow = window
  }

  /**
   * 註冊 IPC 處理器
   */
  register(): void {
    // 設定計時器回呼
    this.timerService.setCallbacks({
      onTick: (data) => this.sendToRenderer(IPC_CHANNELS.TIMER_TICK, data),
      onStateChange: (previousState, currentState) =>
        this.sendToRenderer(IPC_CHANNELS.TIMER_STATE_CHANGE, { previousState, currentState }),
      onComplete: (duration, actualElapsed) =>
        this.sendToRenderer(IPC_CHANNELS.TIMER_COMPLETE, { duration, actualElapsed }),
    })

    // 註冊 IPC 事件監聯
    ipcMain.handle(IPC_CHANNELS.TIMER_START, (_event, duration: number) => {
      this.timerService.start(duration)
      // 返回初始狀態，不使用 getData()（可能已被 tick 更新）
      return {
        state: 'running' as const,
        duration,
        remaining: duration,
        elapsed: 0,
        isOvertime: false,
      }
    })

    ipcMain.handle(IPC_CHANNELS.TIMER_PAUSE, () => {
      this.timerService.pause()
      return this.timerService.getData()
    })

    ipcMain.handle(IPC_CHANNELS.TIMER_RESUME, () => {
      this.timerService.resume()
      return this.timerService.getData()
    })

    ipcMain.handle(IPC_CHANNELS.TIMER_STOP, () => {
      this.timerService.stop()
      return this.timerService.getData()
    })

    ipcMain.handle(IPC_CHANNELS.TIMER_RESET, () => {
      this.timerService.reset()
      return this.timerService.getData()
    })
  }

  /**
   * 取消註冊 IPC 處理器
   */
  unregister(): void {
    ipcMain.removeHandler(IPC_CHANNELS.TIMER_START)
    ipcMain.removeHandler(IPC_CHANNELS.TIMER_PAUSE)
    ipcMain.removeHandler(IPC_CHANNELS.TIMER_RESUME)
    ipcMain.removeHandler(IPC_CHANNELS.TIMER_STOP)
    ipcMain.removeHandler(IPC_CHANNELS.TIMER_RESET)
  }

  /**
   * 發送訊息到渲染程序
   */
  private sendToRenderer(channel: string, data: unknown): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, data)
    }
  }

  /**
   * 取得 TimerService 實例
   */
  getTimerService(): TimerService {
    return this.timerService
  }
}

/**
 * 建立 TimerIpcHandler 實例
 */
export function createTimerIpcHandler(timerService: TimerService): TimerIpcHandler {
  return new TimerIpcHandler(timerService)
}
