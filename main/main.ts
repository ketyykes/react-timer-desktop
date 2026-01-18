// 開發環境關閉 Electron 安全警告（Vite HMR 需要 unsafe-eval）
// 生產環境打包後此警告不會顯示
if (process.env.NODE_ENV === 'development') {
  process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'
}

import { app, BrowserWindow } from 'electron'
import path from 'node:path'
import { TrayManager } from './tray/TrayManager'
import { TimerService } from './timer/TimerService'
import { TimerIpcHandler } from './ipc/timerHandlers'
import { TaskIpcHandler } from './ipc/taskHandlers'
import { NotificationService } from './notification/NotificationService'
import { TaskStore } from './store/TaskStore'
import { formatTime, IPC_CHANNELS } from '../shared/types'
import { registerHistoryHandlers, unregisterHistoryHandlers } from './historyWindow'

// 服務實例
let trayManager: TrayManager | null = null
let timerService: TimerService | null = null
let timerIpcHandler: TimerIpcHandler | null = null
let taskIpcHandler: TaskIpcHandler | null = null
let notificationService: NotificationService | null = null
let taskStore: TaskStore | null = null

/**
 * 取得 preload script 路徑
 */
export function getPreloadPath(): string {
  return path.join(__dirname, '../preload/preload.js')
}

/**
 * 取得渲染程序 HTML 路徑
 */
export function getRendererPath(): string {
  return path.join(__dirname, '../renderer/index.html')
}

/**
 * 判斷是否為開發模式
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}

/**
 * 建立主視窗設定
 */
export function createWindowOptions(): Electron.BrowserWindowConstructorOptions {
  return {
    width: 400,
    height: 300,
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
    },
    // Mac 狀態列應用特性
    frame: false,
    transparent: true,
    resizable: false,
    skipTaskbar: true,
    show: false,
  }
}

/**
 * 建立主視窗
 */
export function createWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow(createWindowOptions())

  // 開發模式載入 Vite dev server，生產模式載入打包後的檔案
  if (isDevelopment()) {
    mainWindow.loadURL('http://localhost:5173')
  } else {
    mainWindow.loadFile(getRendererPath())
  }

  return mainWindow
}

/**
 * 初始化 TrayManager
 */
export function initializeTray(): TrayManager {
  const manager = new TrayManager()
  manager.initialize()
  // 事件回呼會在 initializeServices() 中設定
  return manager
}

/**
 * 處理 macOS activate 事件
 */
export function handleActivate(): void {
  // 對於 Tray 應用，不需要重新建立視窗
  // 使用者點擊 Tray 圖示即可開啟視窗
}

/**
 * 處理所有視窗關閉事件
 */
export function handleWindowAllClosed(): void {
  // 對於 Tray 應用，關閉視窗不應該退出應用
  // 應用應該繼續在狀態列運行
  if (process.platform !== 'darwin') {
    // 在 Windows/Linux 上也保持運行
  }
}

/**
 * 取得 TrayManager 實例
 */
export function getTrayManager(): TrayManager | null {
  return trayManager
}

/**
 * 取得 TimerService 實例
 */
export function getTimerService(): TimerService | null {
  return timerService
}

/**
 * 取得 NotificationService 實例
 */
export function getNotificationService(): NotificationService | null {
  return notificationService
}

/**
 * 取得 TaskStore 實例
 */
export function getTaskStore(): TaskStore | null {
  return taskStore
}

// 預設計時時間（25 分鐘）
const DEFAULT_TIMER_DURATION = 25 * 60 * 1000

/**
 * 初始化計時器和通知服務
 */
export function initializeServices(): void {
  // 初始化計時器服務
  timerService = new TimerService()

  // 初始化通知服務
  notificationService = new NotificationService({
    onClick: () => {
      // 通知點擊時顯示視窗
      trayManager?.showWindow()
    },
  })

  // 設定計時器完成時的通知和狀態更新
  timerService.setCallbacks({
    onComplete: (duration, _actualElapsed, mode) => {
      notificationService?.showTimerComplete(duration, mode)
    },
    onTick: (data) => {
      // 更新 Tray 標題 - 根據模式選擇正確的格式化方式
      // countdown 用 ceil（確保剩餘時間不低估），countup 用 floor（確保經過時間不高估）
      const useCeil = data.mode === 'countdown'
      trayManager?.updateTitle(formatTime(data.displayTime, useCeil))
    },
    onStateChange: (_previousState, currentState) => {
      // 根據計時器狀態更新 Tray 選單
      trayManager?.updateMenuForState(currentState)
      // 當計時器停止或重置時，清除 Tray 標題
      if (currentState === 'idle') {
        trayManager?.updateTitle('')
      }
    },
  })

  // 設定 Tray 選單的事件回呼
  if (trayManager) {
    trayManager.onStart = () => {
      if (!timerService) return
      const data = timerService.getData()
      if (data.state === 'paused') {
        // 暫停中則繼續
        timerService.resume()
      } else if (data.state === 'idle') {
        // 閒置中則以預設時間開始正數計時
        timerService.start(DEFAULT_TIMER_DURATION, 'countup')
      }
    }

    trayManager.onPause = () => {
      timerService?.pause()
    }

    trayManager.onStop = () => {
      if (!timerService) return
      const data = timerService.getData()
      // 只有在計時中才處理
      if (data.state === 'idle') return

      // 取得計時資料
      const stopData = {
        duration: data.duration,
        actualElapsed: data.elapsed,
        mode: data.mode,
      }

      // 停止計時器
      timerService.stop()

      // 顯示視窗並發送事件給渲染程序打開 TaskDialog
      trayManager?.showWindow()
      const window = trayManager?.getWindow()
      if (window && !window.isDestroyed()) {
        window.webContents.send(IPC_CHANNELS.TIMER_STOP_FROM_TRAY, stopData)
      }
    }
  }

  // 初始化 IPC 處理器
  timerIpcHandler = new TimerIpcHandler(timerService)
  timerIpcHandler.register()

  // 連接 TrayManager 視窗到 IPC 處理器
  if (trayManager) {
    const window = trayManager.getWindow()
    if (window) {
      timerIpcHandler.setMainWindow(window)
    }
  }

  // 初始化任務儲存和 IPC 處理器
  taskStore = new TaskStore()
  taskIpcHandler = new TaskIpcHandler(taskStore)
  taskIpcHandler.register()

  // 註冊歷史記錄視窗 IPC 處理器
  registerHistoryHandlers()
}

/**
 * 初始化應用程式
 */
export function initializeApp(): void {
  app.whenReady().then(() => {
    // 初始化 Tray
    trayManager = initializeTray()

    // 初始化計時器和通知服務
    initializeServices()

    app.on('activate', handleActivate)
  })

  app.on('window-all-closed', handleWindowAllClosed)

  // 應用退出前清理
  app.on('before-quit', () => {
    timerIpcHandler?.unregister()
    taskIpcHandler?.unregister()
    unregisterHistoryHandlers()
    timerService?.destroy()
    trayManager?.destroy()
    trayManager = null
    timerService = null
    timerIpcHandler = null
    taskIpcHandler = null
    notificationService = null
    taskStore = null
  })
}

// 只在非測試環境下自動啟動
if (process.env.NODE_ENV !== 'test') {
  initializeApp()
}
