import { Tray, Menu, nativeImage, BrowserWindow, app, screen, MenuItemConstructorOptions } from 'electron'
import path from 'node:path'

/**
 * 計時器狀態
 */
export type TimerState = 'idle' | 'running' | 'paused' | 'overtime'

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
    // 在開發模式使用原始碼路徑，生產模式使用打包後路徑
    const isDev = process.env.NODE_ENV === 'development'
    const basePath = isDev ? __dirname : app.getAppPath()
    return path.join(basePath, 'tray', 'icons', 'tray-icon.png')
  }

  /**
   * 建立 Tray 圖示
   * 使用程式碼繪製一個簡單的計時器圖示
   */
  private createTrayIcon(): Electron.NativeImage {
    const iconPath = this.getIconPath()
    let icon = nativeImage.createFromPath(iconPath)

    // 如果圖示載入失敗，建立一個計時器模板圖示
    if (icon.isEmpty()) {
      // 建立 22x22 的模板圖示 (macOS 狀態列標準大小)
      // 使用 Data URL 建立一個簡單的圓形計時器圖示
      const size = 22
      const canvas = `
        <svg width="${size}" height="${size}" viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg">
          <circle cx="11" cy="12" r="8" stroke="black" stroke-width="1.5" fill="none"/>
          <line x1="11" y1="12" x2="11" y2="7" stroke="black" stroke-width="1.5" stroke-linecap="round"/>
          <line x1="11" y1="12" x2="14" y2="12" stroke="black" stroke-width="1.5" stroke-linecap="round"/>
          <line x1="11" y1="3" x2="11" y2="4" stroke="black" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      `
      const dataUrl = `data:image/svg+xml;base64,${Buffer.from(canvas).toString('base64')}`
      icon = nativeImage.createFromDataURL(dataUrl)
      icon.setTemplateImage(true)
    }

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
      transparent: true,
      webPreferences: {
        preload: path.join(__dirname, '..', 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
      },
    }
  }

  /**
   * 建立 BrowserWindow
   */
  private createWindow(): BrowserWindow {
    const window = new BrowserWindow(this.createWindowOptions())

    // 載入渲染程序
    if (process.env.NODE_ENV === 'development') {
      window.loadURL('http://localhost:5173')
    } else {
      window.loadFile(path.join(__dirname, '..', '..', 'renderer', 'index.html'))
    }

    // 點擊視窗外部時隱藏
    window.on('blur', () => {
      this.hideWindow()
    })

    return window
  }

  /**
   * 建立右鍵選單模板
   */
  private createMenuTemplate(): MenuItemConstructorOptions[] {
    // 初始化選單項目設定
    this.menuItems.set('start', { id: 'start', label: '開始計時', enabled: true })
    this.menuItems.set('pause', { id: 'pause', label: '暫停', enabled: false })
    this.menuItems.set('stop', { id: 'stop', label: '停止', enabled: false })

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
   * 銷毀 TrayManager
   */
  public destroy(): void {
    this.window?.close()
    this.window = null
    this.tray?.destroy()
    this.tray = null
  }
}
