import { app, BrowserWindow } from 'electron'
import path from 'node:path'
import { TrayManager } from './tray/TrayManager'
import { TimerService } from './timer/TimerService'
import { TimerIpcHandler } from './ipc/timerHandlers'
import { TaskIpcHandler } from './ipc/taskHandlers'
import { NotificationService } from './notification/NotificationService'
import { TaskStore } from './store/TaskStore'

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
  return path.join(__dirname, '../preload/preload.mjs')
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

  // 設定事件回呼（後續 P3 實作計時器邏輯時使用）
  manager.onStart = () => {
    console.log('Timer start requested')
    // TODO: P3 - 實作計時器啟動邏輯
  }

  manager.onPause = () => {
    console.log('Timer pause requested')
    // TODO: P3 - 實作計時器暫停邏輯
  }

  manager.onStop = () => {
    console.log('Timer stop requested')
    // TODO: P3 - 實作計時器停止邏輯
  }

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

  // 設定計時器完成時的通知
  timerService.setCallbacks({
    onComplete: (duration) => {
      notificationService?.showTimerComplete(duration)
    },
    onTick: (data) => {
      // 更新 Tray 標題
      trayManager?.setTitle(data.remaining > 0 ? timerService!.getFormattedTime() : `-${timerService!.getFormattedTime().slice(1)}`)
    },
  })

  // 初始化 IPC 處理器
  timerIpcHandler = new TimerIpcHandler(timerService)
  timerIpcHandler.register()

  // 初始化任務儲存和 IPC 處理器
  taskStore = new TaskStore()
  taskIpcHandler = new TaskIpcHandler(taskStore)
  taskIpcHandler.register()
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
