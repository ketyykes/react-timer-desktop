# Window Access Feature Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 解決 macOS 狀態列被佔滿時無法存取計時器的問題，實作 Dock 圖示支援和浮動視窗模式。

**Architecture:** 新增 DockManager 類別處理 Dock 功能，擴展 TrayManager 支援 popover/floating 模式切換。使用 electron-store 持久化視窗設定。透過 IPC 讓 Renderer 可控制視窗模式。

**Tech Stack:** Electron 33 (app.dock API)、electron-store、React 19、Lucide React icons

---

## Task 1: 新增 IPC 通道和型別定義

**Files:**
- Modify: `shared/types.ts:52-74`

**Step 1: 新增 WindowMode 型別和 IPC 通道**

在 `shared/types.ts` 檔案末尾新增：

```typescript
/**
 * 視窗模式
 */
export type WindowMode = 'popover' | 'floating'

/**
 * 視窗設定
 */
export interface WindowSettings {
  mode: WindowMode
  floatingPosition: { x: number; y: number } | null
}
```

**Step 2: 擴展 IPC_CHANNELS**

在 `IPC_CHANNELS` 物件中新增視窗相關通道：

```typescript
export const IPC_CHANNELS = {
  // ... 既有通道 ...

  // 視窗控制
  WINDOW_PIN: 'window:pin',
  WINDOW_MODE_CHANGE: 'window:modeChange',
  WINDOW_GET_MODE: 'window:getMode',
} as const
```

**Step 3: 驗證**

Run: `pnpm run lint`
Expected: No errors

**Step 4: Commit**

```bash
git add shared/types.ts
git commit -m "feat: add WindowMode type and IPC channels for window control"
```

---

## Task 2: 建立 WindowSettingsStore

**Files:**
- Create: `main/store/WindowSettingsStore.ts`
- Test: `main/store/__tests__/WindowSettingsStore.test.ts`

**Step 1: 建立測試檔案**

Create `main/store/__tests__/WindowSettingsStore.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { WindowSettingsStore } from '../WindowSettingsStore'

// Mock electron-store
vi.mock('electron-store', () => {
  return {
    default: vi.fn().mockImplementation(() => {
      const data: Record<string, unknown> = {
        mode: 'popover',
        floatingPosition: null,
      }
      return {
        get: vi.fn((key: string) => data[key]),
        set: vi.fn((key: string, value: unknown) => {
          data[key] = value
        }),
      }
    }),
  }
})

describe('WindowSettingsStore', () => {
  let store: WindowSettingsStore

  beforeEach(() => {
    vi.clearAllMocks()
    store = new WindowSettingsStore()
  })

  describe('getMode', () => {
    it('returns default mode as popover', () => {
      expect(store.getMode()).toBe('popover')
    })
  })

  describe('setMode', () => {
    it('saves floating mode', () => {
      store.setMode('floating')
      expect(store.getMode()).toBe('floating')
    })
  })

  describe('getFloatingPosition', () => {
    it('returns null by default', () => {
      expect(store.getFloatingPosition()).toBeNull()
    })
  })

  describe('setFloatingPosition', () => {
    it('saves position', () => {
      store.setFloatingPosition({ x: 100, y: 200 })
      expect(store.getFloatingPosition()).toEqual({ x: 100, y: 200 })
    })
  })

  describe('getAll', () => {
    it('returns all settings', () => {
      const settings = store.getAll()
      expect(settings).toHaveProperty('mode')
      expect(settings).toHaveProperty('floatingPosition')
    })
  })
})
```

**Step 2: 執行測試確認失敗**

Run: `pnpm test main/store/__tests__/WindowSettingsStore.test.ts`
Expected: FAIL - Cannot find module '../WindowSettingsStore'

**Step 3: 實作 WindowSettingsStore**

Create `main/store/WindowSettingsStore.ts`:

```typescript
import Store from 'electron-store'
import type { WindowMode, WindowSettings } from '../../shared/types'

interface StoreSchema {
  mode: WindowMode
  floatingPosition: { x: number; y: number } | null
}

/**
 * 視窗設定儲存服務
 */
export class WindowSettingsStore {
  private store: Store<StoreSchema>

  constructor() {
    this.store = new Store<StoreSchema>({
      name: 'window-settings',
      defaults: {
        mode: 'popover',
        floatingPosition: null,
      },
    })
  }

  getMode(): WindowMode {
    return this.store.get('mode')
  }

  setMode(mode: WindowMode): void {
    this.store.set('mode', mode)
  }

  getFloatingPosition(): { x: number; y: number } | null {
    return this.store.get('floatingPosition')
  }

  setFloatingPosition(position: { x: number; y: number }): void {
    this.store.set('floatingPosition', position)
  }

  getAll(): WindowSettings {
    return {
      mode: this.getMode(),
      floatingPosition: this.getFloatingPosition(),
    }
  }
}
```

**Step 4: 執行測試確認通過**

Run: `pnpm test main/store/__tests__/WindowSettingsStore.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add main/store/WindowSettingsStore.ts main/store/__tests__/WindowSettingsStore.test.ts
git commit -m "feat: add WindowSettingsStore for persisting window mode and position"
```

---

## Task 3: 建立 DockManager

**Files:**
- Create: `main/dock/DockManager.ts`
- Test: `main/dock/__tests__/DockManager.test.ts`

**Step 1: 建立測試檔案**

Create `main/dock/__tests__/DockManager.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DockManager } from '../DockManager'

// Mock electron
vi.mock('electron', () => ({
  app: {
    dock: {
      setBadge: vi.fn(),
      setMenu: vi.fn(),
    },
  },
  Menu: {
    buildFromTemplate: vi.fn().mockReturnValue({}),
  },
}))

describe('DockManager', () => {
  let manager: DockManager

  beforeEach(() => {
    vi.clearAllMocks()
    manager = new DockManager()
  })

  describe('initialize', () => {
    it('sets up dock menu', () => {
      const { Menu, app } = require('electron')
      manager.initialize()
      expect(Menu.buildFromTemplate).toHaveBeenCalled()
      expect(app.dock.setMenu).toHaveBeenCalled()
    })
  })

  describe('updateBadge', () => {
    it('shows remaining minutes when running', () => {
      const { app } = require('electron')
      manager.updateBadge('running', 150000, 0) // 2.5 minutes remaining
      expect(app.dock.setBadge).toHaveBeenCalledWith('3')
    })

    it('shows overtime badge with plus sign', () => {
      const { app } = require('electron')
      manager.updateBadge('overtime', 0, 180000) // 3 minutes overtime
      expect(app.dock.setBadge).toHaveBeenCalledWith('+3')
    })

    it('clears badge when idle', () => {
      const { app } = require('electron')
      manager.updateBadge('idle', 0, 0)
      expect(app.dock.setBadge).toHaveBeenCalledWith('')
    })
  })

  describe('clearBadge', () => {
    it('sets empty badge', () => {
      const { app } = require('electron')
      manager.clearBadge()
      expect(app.dock.setBadge).toHaveBeenCalledWith('')
    })
  })
})
```

**Step 2: 執行測試確認失敗**

Run: `pnpm test main/dock/__tests__/DockManager.test.ts`
Expected: FAIL - Cannot find module '../DockManager'

**Step 3: 建立目錄和實作 DockManager**

Create `main/dock/DockManager.ts`:

```typescript
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
```

**Step 4: 執行測試確認通過**

Run: `pnpm test main/dock/__tests__/DockManager.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add main/dock/DockManager.ts main/dock/__tests__/DockManager.test.ts
git commit -m "feat: add DockManager for macOS Dock badge and menu"
```

---

## Task 4: 修改 TrayManager 支援浮動模式

**Files:**
- Modify: `main/tray/TrayManager.ts`
- Test: `main/tray/__tests__/TrayManager.test.ts`

**Step 1: 更新 TrayManager 測試**

在 `main/tray/__tests__/TrayManager.test.ts` 新增測試案例：

```typescript
describe('floating mode', () => {
  it('togglePinned switches between popover and floating', () => {
    manager.initialize()
    expect(manager.getWindowMode()).toBe('popover')

    manager.togglePinned()
    expect(manager.getWindowMode()).toBe('floating')

    manager.togglePinned()
    expect(manager.getWindowMode()).toBe('popover')
  })

  it('does not hide window on blur when floating', () => {
    manager.initialize()
    manager.togglePinned() // Switch to floating
    manager.showWindow()

    // Simulate blur - window should remain visible
    const window = manager.getWindow()
    expect(window?.isVisible()).toBe(true)
  })
})
```

**Step 2: 執行測試確認失敗**

Run: `pnpm test main/tray/__tests__/TrayManager.test.ts -- --grep "floating mode"`
Expected: FAIL - getWindowMode is not a function

**Step 3: 修改 TrayManager 類別**

在 `main/tray/TrayManager.ts` 加入以下變更：

3.1 匯入新型別：

```typescript
import type { TimerState, WindowMode } from '../../shared/types'
import { WindowSettingsStore } from '../store/WindowSettingsStore'
```

3.2 新增私有屬性：

```typescript
export class TrayManager {
  private tray: Tray | null = null
  private window: BrowserWindow | null = null
  private menuItems: Map<MenuItemId, MenuItemConfig> = new Map()
  private windowMode: WindowMode = 'popover'
  private settingsStore: WindowSettingsStore | null = null

  // ... 既有屬性 ...
}
```

3.3 修改 `createWindowOptions()`：

```typescript
private createWindowOptions(): Electron.BrowserWindowConstructorOptions {
  const baseOptions: Electron.BrowserWindowConstructorOptions = {
    width: 400,
    height: 340,
    show: false,
    frame: false,
    resizable: false,
    // skipTaskbar: true,  // 移除，讓 Dock 顯示
    movable: true,          // 新增，允許拖動
    alwaysOnTop: true,
    // ... 其他設定不變
  }
  // ...
}
```

3.4 修改 `createWindow()` 中的 blur 處理：

```typescript
private createWindow(): BrowserWindow {
  const window = new BrowserWindow(this.createWindowOptions())

  // ... 既有程式碼 ...

  // 修改失焦行為
  if (process.env.NODE_ENV !== 'development') {
    window.on('blur', () => {
      // 只有 popover 模式才自動隱藏
      if (this.windowMode === 'popover') {
        this.hideWindow()
      }
    })
  }

  // 監聽視窗移動，儲存浮動位置
  window.on('moved', () => {
    if (this.windowMode === 'floating' && this.settingsStore) {
      const [x, y] = window.getPosition()
      this.settingsStore.setFloatingPosition({ x, y })
    }
  })

  return window
}
```

3.5 新增方法：

```typescript
/**
 * 設定設定儲存實例
 */
public setSettingsStore(store: WindowSettingsStore): void {
  this.settingsStore = store
  // 載入儲存的模式
  this.windowMode = store.getMode()
}

/**
 * 切換釘選模式
 */
public togglePinned(): WindowMode {
  if (this.windowMode === 'popover') {
    this.windowMode = 'floating'
  } else {
    this.windowMode = 'popover'
    this.hideWindow()
  }

  // 儲存設定
  this.settingsStore?.setMode(this.windowMode)

  return this.windowMode
}

/**
 * 取得目前視窗模式
 */
public getWindowMode(): WindowMode {
  return this.windowMode
}
```

3.6 修改 `showWindow()`：

```typescript
public showWindow(): void {
  if (!this.window) return

  if (this.windowMode === 'floating') {
    // 浮動模式：使用儲存的位置或螢幕置中
    const savedPosition = this.settingsStore?.getFloatingPosition()
    if (savedPosition) {
      this.window.setPosition(savedPosition.x, savedPosition.y)
    } else {
      // 螢幕置中
      this.window.center()
    }
  } else {
    // Popover 模式：顯示在 Tray 下方
    const position = this.calculateWindowPosition()
    this.window.setPosition(position.x, position.y)
  }

  this.window.show()
}
```

**Step 4: 執行測試確認通過**

Run: `pnpm test main/tray/__tests__/TrayManager.test.ts`
Expected: PASS

**Step 5: 執行全部測試**

Run: `pnpm test`
Expected: All tests pass

**Step 6: Commit**

```bash
git add main/tray/TrayManager.ts main/tray/__tests__/TrayManager.test.ts
git commit -m "feat: add floating window mode support to TrayManager"
```

---

## Task 5: 整合 DockManager 到 main.ts

**Files:**
- Modify: `main/main.ts`

**Step 1: 匯入 DockManager 和 WindowSettingsStore**

在 `main/main.ts` 頂部新增：

```typescript
import { DockManager } from './dock/DockManager'
import { WindowSettingsStore } from './store/WindowSettingsStore'
```

**Step 2: 新增服務實例**

```typescript
// 服務實例
let trayManager: TrayManager | null = null
let dockManager: DockManager | null = null
let windowSettingsStore: WindowSettingsStore | null = null
// ... 其他既有實例
```

**Step 3: 修改 initializeServices()**

在 `initializeServices()` 函式中新增：

```typescript
export function initializeServices(): void {
  // 初始化視窗設定儲存
  windowSettingsStore = new WindowSettingsStore()

  // 連接設定儲存到 TrayManager
  if (trayManager && windowSettingsStore) {
    trayManager.setSettingsStore(windowSettingsStore)
  }

  // 初始化 Dock 管理器（僅 macOS）
  if (process.platform === 'darwin') {
    dockManager = new DockManager()
    dockManager.initialize()

    // 設定 Dock 選單回呼（與 Tray 同步）
    dockManager.onStart = () => trayManager?.onStart?.()
    dockManager.onPause = () => trayManager?.onPause?.()
    dockManager.onStop = () => trayManager?.onStop?.()
  }

  // ... 既有的 timerService 初始化 ...

  // 修改 onTick 回呼，同時更新 Dock badge
  timerService.setCallbacks({
    onTick: (data) => {
      const useCeil = data.mode === 'countdown'
      trayManager?.updateTitle(formatTime(data.displayTime, useCeil))

      // 更新 Dock badge
      if (dockManager) {
        const overtime = data.isOvertime ? Math.abs(data.remaining) : 0
        dockManager.updateBadge(data.state, data.remaining, overtime)
      }
    },
    onStateChange: (_previousState, currentState) => {
      trayManager?.updateMenuForState(currentState)
      dockManager?.updateMenuForState(currentState)

      if (currentState === 'idle') {
        trayManager?.updateTitle('')
        dockManager?.clearBadge()
      }
    },
    // ... 既有的 onComplete
  })

  // ... 其餘既有程式碼 ...
}
```

**Step 4: 修改 handleActivate() 處理 Dock 點擊**

```typescript
export function handleActivate(): void {
  // Dock 點擊時顯示視窗
  trayManager?.showWindow()
}
```

**Step 5: 修改清理程式碼**

在 `before-quit` 事件中新增：

```typescript
app.on('before-quit', () => {
  // ... 既有清理 ...
  dockManager = null
  windowSettingsStore = null
})
```

**Step 6: 驗證編譯**

Run: `pnpm run build`
Expected: Build success

**Step 7: Commit**

```bash
git add main/main.ts
git commit -m "feat: integrate DockManager and WindowSettingsStore into main process"
```

---

## Task 6: 新增 Preload API

**Files:**
- Modify: `main/preload.ts`

**Step 1: 新增視窗控制 API**

在 `main/preload.ts` 的 `electronAPI` 物件中新增：

```typescript
export const electronAPI = {
  // ... 既有 API ...

  // 視窗控制
  window: {
    togglePin: (): Promise<WindowMode> => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_PIN),
    getMode: (): Promise<WindowMode> => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_GET_MODE),
    onModeChange: (callback: (mode: WindowMode) => void): (() => void) => {
      const handler = (_event: IpcRendererEvent, mode: WindowMode) => callback(mode)
      ipcRenderer.on(IPC_CHANNELS.WINDOW_MODE_CHANGE, handler)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.WINDOW_MODE_CHANGE, handler)
    },
  },
}
```

**Step 2: 新增型別匯入**

```typescript
import { IPC_CHANNELS, TimerData, TimerState, TimerMode, TaskRecord, WindowMode } from '../shared/types'
```

**Step 3: 在 main.ts 註冊 IPC 處理器**

在 `main/main.ts` 的 `initializeServices()` 中新增：

```typescript
import { ipcMain } from 'electron'
import { IPC_CHANNELS } from '../shared/types'

// 在 initializeServices() 中：

// 視窗控制 IPC
ipcMain.handle(IPC_CHANNELS.WINDOW_PIN, () => {
  const mode = trayManager?.togglePinned()
  const window = trayManager?.getWindow()
  if (window && !window.isDestroyed()) {
    window.webContents.send(IPC_CHANNELS.WINDOW_MODE_CHANGE, mode)
  }
  return mode
})

ipcMain.handle(IPC_CHANNELS.WINDOW_GET_MODE, () => {
  return trayManager?.getWindowMode() ?? 'popover'
})
```

**Step 4: 驗證**

Run: `pnpm run lint && pnpm run build`
Expected: No errors

**Step 5: Commit**

```bash
git add main/preload.ts main/main.ts
git commit -m "feat: add window control IPC API for pin/unpin functionality"
```

---

## Task 7: 建立 PinButton 元件

**Files:**
- Create: `renderer/src/components/ui/pin-button.tsx`
- Test: `renderer/src/components/ui/__tests__/pin-button.test.tsx`

**Step 1: 建立測試檔案**

Create `renderer/src/components/ui/__tests__/pin-button.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PinButton } from '../pin-button'

describe('PinButton', () => {
  it('renders unpinned state by default', () => {
    render(<PinButton isPinned={false} onClick={() => {}} />)
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false')
  })

  it('renders pinned state when isPinned is true', () => {
    render(<PinButton isPinned={true} onClick={() => {}} />)
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true')
  })

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn()
    render(<PinButton isPinned={false} onClick={handleClick} />)
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('shows correct tooltip for unpinned state', () => {
    render(<PinButton isPinned={false} onClick={() => {}} />)
    expect(screen.getByRole('button')).toHaveAttribute('title', '釘選視窗')
  })

  it('shows correct tooltip for pinned state', () => {
    render(<PinButton isPinned={true} onClick={() => {}} />)
    expect(screen.getByRole('button')).toHaveAttribute('title', '取消釘選')
  })
})
```

**Step 2: 執行測試確認失敗**

Run: `cd renderer && pnpm test src/components/ui/__tests__/pin-button.test.tsx`
Expected: FAIL - Cannot find module '../pin-button'

**Step 3: 安裝 lucide-react（如尚未安裝）**

Run: `cd renderer && pnpm add lucide-react`

**Step 4: 實作 PinButton 元件**

Create `renderer/src/components/ui/pin-button.tsx`:

```tsx
import { Pin, PinOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PinButtonProps {
  isPinned: boolean
  onClick: () => void
  className?: string
}

export function PinButton({ isPinned, onClick, className }: PinButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'p-1.5 rounded-md transition-colors',
        'hover:bg-white/10 active:bg-white/20',
        'text-white/60 hover:text-white/90',
        'focus:outline-none focus:ring-2 focus:ring-white/20',
        className
      )}
      aria-pressed={isPinned}
      title={isPinned ? '取消釘選' : '釘選視窗'}
    >
      {isPinned ? (
        <Pin className="w-4 h-4 fill-current" />
      ) : (
        <PinOff className="w-4 h-4" />
      )}
    </button>
  )
}
```

**Step 5: 執行測試確認通過**

Run: `cd renderer && pnpm test src/components/ui/__tests__/pin-button.test.tsx`
Expected: PASS

**Step 6: Commit**

```bash
git add renderer/src/components/ui/pin-button.tsx renderer/src/components/ui/__tests__/pin-button.test.tsx renderer/package.json renderer/pnpm-lock.yaml
git commit -m "feat: add PinButton component for window pinning"
```

---

## Task 8: 修改 App.tsx 加入釘選功能

**Files:**
- Modify: `renderer/src/App.tsx`

**Step 1: 新增釘選狀態和事件處理**

在 `App.tsx` 中新增：

```tsx
import { useState, useEffect, useCallback } from 'react'
import { PinButton } from '@/components/ui/pin-button'
// ... 其他 imports

const App = () => {
  // ... 既有狀態 ...

  // 視窗模式狀態
  const [isPinned, setIsPinned] = useState(false)

  // 載入初始視窗模式
  useEffect(() => {
    const api = window.electronAPI?.window
    if (api?.getMode) {
      api.getMode().then((mode) => {
        setIsPinned(mode === 'floating')
      })
    }
  }, [])

  // 監聽視窗模式變更
  useEffect(() => {
    const api = window.electronAPI?.window
    if (!api?.onModeChange) return

    const unsubscribe = api.onModeChange((mode) => {
      setIsPinned(mode === 'floating')
    })

    return unsubscribe
  }, [])

  // 處理釘選切換
  const handlePinToggle = useCallback(async () => {
    const api = window.electronAPI?.window
    if (api?.togglePin) {
      const newMode = await api.togglePin()
      setIsPinned(newMode === 'floating')
    }
  }, [])

  // ... 既有程式碼 ...
}
```

**Step 2: 修改 JSX 加入 PinButton**

```tsx
return (
  <div className="h-full glass-container flex flex-col rounded-xl overflow-hidden">
    {/* 標題列 - 新增 */}
    <div className="flex justify-end p-2">
      <PinButton isPinned={isPinned} onClick={handlePinToggle} />
    </div>

    {/* 計時器區塊 - 調整 flex */}
    <div className="flex-[3] flex items-center justify-center p-3 pt-0">
      {/* ... 既有內容 ... */}
    </div>

    {/* ... 其餘既有內容 ... */}
  </div>
)
```

**Step 3: 更新 electron.d.ts 型別定義**

Modify `renderer/src/electron.d.ts`:

```typescript
import type { WindowMode } from '../../shared/types'

interface ElectronAPI {
  // ... 既有定義 ...
  window: {
    togglePin: () => Promise<WindowMode>
    getMode: () => Promise<WindowMode>
    onModeChange: (callback: (mode: WindowMode) => void) => () => void
  }
}
```

**Step 4: 驗證**

Run: `cd renderer && pnpm run lint && pnpm run build`
Expected: No errors

**Step 5: 執行完整測試**

Run: `pnpm test && cd renderer && pnpm test`
Expected: All tests pass

**Step 6: Commit**

```bash
git add renderer/src/App.tsx renderer/src/electron.d.ts
git commit -m "feat: integrate PinButton into App for window pinning control"
```

---

## Task 9: 手動測試驗證

**Step 1: 啟動開發伺服器**

Run: `pnpm dev`

**Step 2: 驗證 Dock 功能**

- [ ] 應用啟動後 Dock 顯示圖示
- [ ] 開始計時後 Dock badge 顯示剩餘分鐘數
- [ ] 超時後 badge 顯示 +N
- [ ] 右鍵 Dock 圖示顯示選單（開始/暫停/停止）
- [ ] 點擊 Dock 圖示顯示視窗

**Step 3: 驗證浮動視窗功能**

- [ ] 視窗右上角顯示釘選按鈕（空心圖釘）
- [ ] 點擊釘選按鈕後圖示變為填滿
- [ ] 釘選後點擊視窗外部不會隱藏視窗
- [ ] 釘選後可以拖動視窗
- [ ] 再次點擊釘選按鈕取消釘選
- [ ] 取消釘選後視窗隱藏
- [ ] 重新開啟視窗恢復 Popover 行為

**Step 4: 驗證持久化**

- [ ] 釘選後關閉並重新啟動應用
- [ ] 視窗自動以浮動模式開啟
- [ ] 浮動位置正確恢復

**Step 5: Final Commit**

```bash
git add -A
git commit -m "feat: complete window access feature with Dock and floating mode"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | IPC 通道和型別 | shared/types.ts |
| 2 | WindowSettingsStore | main/store/WindowSettingsStore.ts |
| 3 | DockManager | main/dock/DockManager.ts |
| 4 | TrayManager 浮動模式 | main/tray/TrayManager.ts |
| 5 | main.ts 整合 | main/main.ts |
| 6 | Preload API | main/preload.ts |
| 7 | PinButton 元件 | renderer/src/components/ui/pin-button.tsx |
| 8 | App.tsx 整合 | renderer/src/App.tsx |
| 9 | 手動測試 | - |

Total: 9 tasks, ~18 commits
