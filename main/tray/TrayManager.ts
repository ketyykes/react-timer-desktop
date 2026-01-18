import { Tray, Menu, nativeImage, BrowserWindow, app, screen, MenuItemConstructorOptions } from 'electron'
import path from 'node:path'
import type { TimerState } from '../../shared/types'

/**
 * 選單項目 ID
 */
export type MenuItemId = 'start' | 'pause' | 'stop'

/**
 * 選單項目設定
 */
interface MenuItemConfig {
  id: MenuItemId
  label: string
  enabled: boolean
}

/**
 * TrayManager - 管理 Mac 狀態列 Tray 功能
 */
export class TrayManager {
  private tray: Tray | null = null
  private window: BrowserWindow | null = null
  private menuItems: Map<MenuItemId, MenuItemConfig> = new Map()

  // 事件回呼
  public onStart: (() => void) | null = null
  public onPause: (() => void) | null = null
  public onStop: (() => void) | null = null

  /**
   * 取得 Tray 圖示路徑
   */
  private getIconPath(): string {
    // 開發模式：從專案根目錄載入
    // 生產模式：從 app 路徑載入
    const isDev = process.env.NODE_ENV === 'development'
    if (isDev) {
      // 開發模式下 __dirname 是 dist/main，需要回到專案根目錄
      return path.join(__dirname, '..', '..', 'main', 'tray', 'icons', 'tray-icon.png')
    }
    return path.join(app.getAppPath(), 'main', 'tray', 'icons', 'tray-icon.png')
  }

  /**
   * 建立 Tray 圖示
   * macOS menu bar 標準大小為 16x16 或 22x22
   */
  private createTrayIcon(): Electron.NativeImage {
    const iconPath = this.getIconPath()
    let icon = nativeImage.createFromPath(iconPath)

    // 如果載入失敗，使用空圖示
    if (icon.isEmpty()) {
      console.warn(`Tray icon not found at: ${iconPath}`)
      icon = nativeImage.createEmpty()
    }

    // 縮小到 18x18（適合 macOS menu bar）
    icon = icon.resize({ width: 18, height: 18 })

    return icon
  }

  /**
   * 建立視窗設定
   */
  private createWindowOptions(): Electron.BrowserWindowConstructorOptions {
    return {
      width: 400,
      height: 300,
      show: false,
      frame: false,
      resizable: false,
      skipTaskbar: true,
      alwaysOnTop: true,
      transparent: false,
      backgroundColor: '#ffffff',
      webPreferences: {
        preload: path.join(__dirname, '..', 'preload', 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
      },
    }
  }

  /**
   * 設定 Content Security Policy
   * 只在生產環境啟用，開發環境 Vite HMR 需要行內腳本
   */
  private setupContentSecurityPolicy(window: BrowserWindow): void {
    // 開發環境不設定 CSP（Vite HMR 需要 inline script 和 eval）
    if (process.env.NODE_ENV === 'development') {
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
   * 建立 BrowserWindow
   */
  private createWindow(): BrowserWindow {
    const window = new BrowserWindow(this.createWindowOptions())

    // 設定 CSP（只在生產環境生效）
    this.setupContentSecurityPolicy(window)

    // 載入渲染程序
    if (process.env.NODE_ENV === 'development') {
      window.loadURL('http://localhost:5173')
      // 開發模式自動開啟 DevTools
      window.webContents.openDevTools({ mode: 'detach' })
    } else {
      window.loadFile(path.join(__dirname, '..', '..', 'renderer', 'index.html'))
    }

    // 點擊視窗外部時隱藏（開發模式暫時停用以便 debug）
    if (process.env.NODE_ENV !== 'development') {
      window.on('blur', () => {
        this.hideWindow()
      })
    }

    return window
  }

  /**
   * 初始化選單項目設定（只呼叫一次）
   */
  private initializeMenuItems(): void {
    if (this.menuItems.size === 0) {
      this.menuItems.set('start', { id: 'start', label: '開始計時', enabled: true })
      this.menuItems.set('pause', { id: 'pause', label: '暫停', enabled: false })
      this.menuItems.set('stop', { id: 'stop', label: '停止', enabled: false })
    }
  }

  /**
   * 建立右鍵選單模板
   */
  private createMenuTemplate(): MenuItemConstructorOptions[] {
    // 確保選單項目已初始化
    this.initializeMenuItems()

    return [
      {
        label: '開始計時',
        click: () => this.onStart?.(),
        enabled: this.menuItems.get('start')?.enabled,
      },
      {
        label: '暫停',
        click: () => this.onPause?.(),
        enabled: this.menuItems.get('pause')?.enabled,
      },
      {
        label: '停止',
        click: () => this.onStop?.(),
        enabled: this.menuItems.get('stop')?.enabled,
      },
      { type: 'separator' },
      {
        label: '退出',
        click: () => app.quit(),
      },
    ]
  }

  /**
   * 建立右鍵選單
   */
  private createContextMenu(): Electron.Menu {
    const template = this.createMenuTemplate()
    return Menu.buildFromTemplate(template)
  }

  /**
   * 計算視窗位置（顯示在 Tray 圖示下方）
   */
  private calculateWindowPosition(): { x: number; y: number } {
    if (!this.tray || !this.window) {
      return { x: 0, y: 0 }
    }

    const trayBounds = this.tray.getBounds()
    const windowSize = this.window.getSize()
    const display = screen.getPrimaryDisplay()
    const workArea = display.workAreaSize

    // 計算 X 位置：置中於 Tray 圖示
    let x = Math.round(trayBounds.x + trayBounds.width / 2 - windowSize[0] / 2)

    // 確保視窗不超出螢幕邊界
    if (x < 0) x = 0
    if (x + windowSize[0] > workArea.width) {
      x = workArea.width - windowSize[0]
    }

    // Y 位置：Tray 圖示下方
    const y = trayBounds.y + trayBounds.height

    return { x, y }
  }

  /**
   * 初始化 TrayManager
   */
  public initialize(): void {
    // 建立 Tray
    const icon = this.createTrayIcon()
    this.tray = new Tray(icon)

    // 設定 tooltip
    this.tray.setToolTip('Timer')

    // 設定右鍵選單
    const contextMenu = this.createContextMenu()
    this.tray.setContextMenu(contextMenu)

    // 建立視窗
    this.window = this.createWindow()

    // 點擊 Tray 圖示時切換視窗
    this.tray.on('click', () => {
      this.toggleWindow()
    })
  }

  /**
   * 更新 Tray 標題（顯示剩餘時間）
   */
  public updateTitle(title: string): void {
    this.tray?.setTitle(title)
  }

  /**
   * 顯示視窗
   */
  public showWindow(): void {
    if (!this.window) return

    const position = this.calculateWindowPosition()
    this.window.setPosition(position.x, position.y)
    this.window.show()
  }

  /**
   * 隱藏視窗
   */
  public hideWindow(): void {
    this.window?.hide()
  }

  /**
   * 切換視窗顯示/隱藏
   */
  public toggleWindow(): void {
    if (!this.window) return

    if (this.window.isVisible()) {
      this.hideWindow()
    } else {
      this.showWindow()
    }
  }

  /**
   * 設定選單項目啟用狀態
   */
  public setMenuItemEnabled(itemId: MenuItemId, enabled: boolean): void {
    const item = this.menuItems.get(itemId)
    if (item) {
      item.enabled = enabled
      // 重新建立選單以套用變更
      if (this.tray) {
        this.tray.setContextMenu(this.createContextMenu())
      }
    }
  }

  /**
   * 根據計時器狀態更新選單
   */
  public updateMenuForState(state: TimerState): void {
    switch (state) {
      case 'idle':
        this.setMenuItemEnabled('start', true)
        this.setMenuItemEnabled('pause', false)
        this.setMenuItemEnabled('stop', false)
        break
      case 'running':
      case 'overtime':
        this.setMenuItemEnabled('start', false)
        this.setMenuItemEnabled('pause', true)
        this.setMenuItemEnabled('stop', true)
        break
      case 'paused':
        this.setMenuItemEnabled('start', true)
        this.setMenuItemEnabled('pause', false)
        this.setMenuItemEnabled('stop', true)
        break
    }
  }

  /**
   * 取得視窗實例
   */
  public getWindow(): BrowserWindow | null {
    return this.window
  }

  /**
   * 銷毀 TrayManager
   */
  public destroy(): void {
    this.window?.close()
    this.window = null
    this.tray?.destroy()
    this.tray = null
  }
}
