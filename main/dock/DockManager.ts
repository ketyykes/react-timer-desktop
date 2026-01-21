import { app, Menu, MenuItemConstructorOptions } from 'electron'
import type { TimerState } from '../../shared/types'

/**
 * DockManager - 管理 macOS Dock 功能
 */
export class DockManager {
  // 事件回呼
  public onStart: (() => void) | null = null
  public onPause: (() => void) | null = null
  public onStop: (() => void) | null = null
  public onDockClick: (() => void) | null = null

  private currentState: TimerState = 'idle'

  /**
   * 初始化 Dock 選單
   */
  public initialize(): void {
    // macOS only
    if (process.platform !== 'darwin' || !app.dock) {
      return
    }

    this.updateMenu()
  }

  /**
   * 建立 Dock 選單模板
   */
  private createMenuTemplate(): MenuItemConstructorOptions[] {
    const isIdle = this.currentState === 'idle'
    const isRunning = this.currentState === 'running' || this.currentState === 'overtime'
    const isPaused = this.currentState === 'paused'

    return [
      {
        label: '開始計時',
        click: () => this.onStart?.(),
        enabled: isIdle || isPaused,
      },
      {
        label: '暫停',
        click: () => this.onPause?.(),
        enabled: isRunning,
      },
      {
        label: '停止',
        click: () => this.onStop?.(),
        enabled: isRunning || isPaused,
      },
    ]
  }

  /**
   * 更新 Dock 選單
   */
  private updateMenu(): void {
    if (process.platform !== 'darwin' || !app.dock) {
      return
    }

    const template = this.createMenuTemplate()
    const menu = Menu.buildFromTemplate(template)
    app.dock.setMenu(menu)
  }

  /**
   * 更新 badge 顯示
   * @param state 計時器狀態
   * @param remaining 剩餘時間（毫秒）
   * @param overtime 超時時間（毫秒）
   */
  public updateBadge(state: TimerState, remaining: number, overtime: number): void {
    if (process.platform !== 'darwin' || !app.dock) {
      return
    }

    this.currentState = state

    let badge = ''

    if (state === 'running') {
      // 剩餘分鐘數（無條件進位）
      const minutes = Math.ceil(remaining / 60000)
      badge = minutes.toString()
    } else if (state === 'overtime') {
      // 超時分鐘數
      const minutes = Math.ceil(overtime / 60000)
      badge = `+${minutes}`
    } else if (state === 'paused') {
      // 暫停時也顯示剩餘時間
      const minutes = Math.ceil(remaining / 60000)
      badge = minutes.toString()
    }
    // idle 時不顯示 badge

    app.dock.setBadge(badge)
    this.updateMenu()
  }

  /**
   * 清除 badge
   */
  public clearBadge(): void {
    if (process.platform !== 'darwin' || !app.dock) {
      return
    }
    app.dock.setBadge('')
  }

  /**
   * 根據計時器狀態更新選單
   */
  public updateMenuForState(state: TimerState): void {
    this.currentState = state
    this.updateMenu()
  }
}
