import { BrowserWindow, ipcMain } from 'electron'
import path from 'node:path'
import { IPC_CHANNELS } from '../shared/types'

let historyWindow: BrowserWindow | null = null

/**
 * 取得 preload script 路徑
 */
function getPreloadPath(): string {
  return path.join(__dirname, '../preload/preload.js')
}

/**
 * 判斷是否為開發模式
 */
function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}

/**
 * 設定 Content Security Policy
 * 只在生產環境啟用，開發環境 Vite HMR 需要行內腳本
 */
function setupContentSecurityPolicy(window: BrowserWindow): void {
  // 開發環境不設定 CSP（Vite HMR 需要 inline script 和 eval）
  if (isDevelopment()) {
    return
  }

  const csp = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'"

  window.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [csp],
      },
    })
  })
}

/**
 * 建立歷史記錄視窗
 * 如果視窗已存在且未銷毀，則 focus 現有視窗
 */
export function createHistoryWindow(): BrowserWindow {
  // 如果視窗已存在且未銷毀，focus 並返回
  if (historyWindow && !historyWindow.isDestroyed()) {
    historyWindow.focus()
    return historyWindow
  }

  historyWindow = new BrowserWindow({
    width: 400,
    height: 500,
    title: '歷史記錄',
    webPreferences: {
      preload: getPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  // 設定 CSP
  setupContentSecurityPolicy(historyWindow)

  // 開發模式載入 Vite dev server，生產模式載入打包後的檔案
  if (isDevelopment()) {
    historyWindow.loadURL('http://localhost:5173/history.html')
  } else {
    historyWindow.loadFile(path.join(__dirname, '../renderer/history.html'))
  }

  historyWindow.on('closed', () => {
    historyWindow = null
  })

  return historyWindow
}

/**
 * 取得歷史記錄視窗實例
 */
export function getHistoryWindow(): BrowserWindow | null {
  return historyWindow
}

/**
 * 註冊歷史記錄相關 IPC handlers
 */
export function registerHistoryHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.HISTORY_OPEN, () => {
    createHistoryWindow()
  })
}

/**
 * 移除歷史記錄相關 IPC handlers
 */
export function unregisterHistoryHandlers(): void {
  ipcMain.removeHandler(IPC_CHANNELS.HISTORY_OPEN)
}
