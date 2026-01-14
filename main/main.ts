import { app, BrowserWindow } from 'electron'
import path from 'node:path'

/**
 * 取得 preload script 路徑
 */
export function getPreloadPath(): string {
  return path.join(__dirname, 'preload.js')
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
 * 處理 macOS activate 事件
 */
export function handleActivate(): void {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
}

/**
 * 處理所有視窗關閉事件
 */
export function handleWindowAllClosed(): void {
  if (process.platform !== 'darwin') {
    app.quit()
  }
}

/**
 * 初始化應用程式
 */
export function initializeApp(): void {
  app.whenReady().then(() => {
    createWindow()
    app.on('activate', handleActivate)
  })

  app.on('window-all-closed', handleWindowAllClosed)
}

// 只在非測試環境下自動啟動
if (process.env.NODE_ENV !== 'test') {
  initializeApp()
}
