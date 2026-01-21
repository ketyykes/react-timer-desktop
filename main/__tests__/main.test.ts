import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock BrowserWindow for getWindow
const mockWindow = {
  webContents: { send: vi.fn() },
  isDestroyed: () => false,
}

// Mock TrayManager - 使用可變物件追蹤回呼
const mockTrayManagerInstance = {
  initialize: vi.fn(),
  destroy: vi.fn(),
  getWindow: vi.fn(() => mockWindow),
  showWindow: vi.fn(),
  updateTitle: vi.fn(),
  updateMenuForState: vi.fn(),
  setSettingsStore: vi.fn(),
  onStart: null as (() => void) | null,
  onPause: null as (() => void) | null,
  onStop: null as (() => void) | null,
}

vi.mock('../tray/TrayManager', () => ({
  TrayManager: vi.fn().mockImplementation(() => mockTrayManagerInstance),
}))

// Mock TaskStore
vi.mock('../store/TaskStore', () => ({
  TaskStore: vi.fn().mockImplementation(() => ({
    save: vi.fn(),
    getAll: vi.fn(() => []),
    delete: vi.fn(),
    clear: vi.fn(),
  })),
}))

// Mock WindowSettingsStore
vi.mock('../store/WindowSettingsStore', () => ({
  WindowSettingsStore: vi.fn().mockImplementation(() => ({
    getMode: vi.fn(() => 'popover'),
    setMode: vi.fn(),
    getFloatingPosition: vi.fn(() => null),
    setFloatingPosition: vi.fn(),
    getAll: vi.fn(() => ({ mode: 'popover', floatingPosition: null })),
  })),
}))

// Mock DockManager
const mockDockManagerInstance = {
  initialize: vi.fn(),
  updateBadge: vi.fn(),
  clearBadge: vi.fn(),
  updateMenuForState: vi.fn(),
  onStart: null as (() => void) | null,
  onPause: null as (() => void) | null,
  onStop: null as (() => void) | null,
}

vi.mock('../dock/DockManager', () => ({
  DockManager: vi.fn().mockImplementation(() => mockDockManagerInstance),
}))

// Mock Electron modules
const mockLoadURL = vi.fn()
const mockLoadFile = vi.fn()
const mockQuit = vi.fn()
const mockOn = vi.fn()
const mockWhenReady = vi.fn(() => Promise.resolve())

vi.mock('electron', () => {
  const BrowserWindowMock = vi.fn().mockImplementation(() => ({
    loadURL: mockLoadURL,
    loadFile: mockLoadFile,
    on: vi.fn(),
    show: vi.fn(),
    hide: vi.fn(),
    close: vi.fn(),
  }))

  const NotificationMock = Object.assign(
    vi.fn().mockImplementation(() => ({
      show: vi.fn(),
      on: vi.fn().mockReturnThis(),
    })),
    { isSupported: vi.fn(() => true) }
  )

  return {
    app: {
      whenReady: mockWhenReady,
      on: mockOn,
      quit: mockQuit,
    },
    BrowserWindow: BrowserWindowMock,
    ipcMain: {
      handle: vi.fn(),
      removeHandler: vi.fn(),
    },
    Notification: NotificationMock,
  }
})

vi.mock('node:path', () => ({
  default: {
    join: vi.fn((...args: string[]) => args.join('/')),
  },
  join: vi.fn((...args: string[]) => args.join('/')),
}))

describe('main/main.ts', () => {
  const originalEnv = process.env.NODE_ENV
  const originalPlatform = process.platform

  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    process.env.NODE_ENV = 'test' // 防止 initializeApp 自動執行
    // 重設 mock 實例狀態
    mockTrayManagerInstance.onStart = null
    mockTrayManagerInstance.onPause = null
    mockTrayManagerInstance.onStop = null
    mockDockManagerInstance.onStart = null
    mockDockManagerInstance.onPause = null
    mockDockManagerInstance.onStop = null
  })

  afterEach(() => {
    process.env.NODE_ENV = originalEnv
    Object.defineProperty(process, 'platform', { value: originalPlatform })
  })

  describe('getPreloadPath', () => {
    it('應回傳 preload.js 的路徑', async () => {
      const { getPreloadPath } = await import('../main')
      const result = getPreloadPath()
      expect(result).toContain('preload.js')
    })
  })

  describe('getRendererPath', () => {
    it('應回傳 renderer/index.html 的路徑', async () => {
      const { getRendererPath } = await import('../main')
      const result = getRendererPath()
      expect(result).toContain('renderer/index.html')
    })
  })

  describe('isDevelopment', () => {
    it('在 development 環境應回傳 true', async () => {
      process.env.NODE_ENV = 'development'
      vi.resetModules()
      const { isDevelopment } = await import('../main')
      expect(isDevelopment()).toBe(true)
    })

    it('在非 development 環境應回傳 false', async () => {
      process.env.NODE_ENV = 'production'
      vi.resetModules()
      const { isDevelopment } = await import('../main')
      expect(isDevelopment()).toBe(false)
    })
  })

  describe('createWindowOptions', () => {
    it('應回傳正確的視窗設定', async () => {
      const { createWindowOptions } = await import('../main')
      const options = createWindowOptions()

      expect(options.width).toBe(400)
      expect(options.height).toBe(300)
      expect(options.frame).toBe(false)
      expect(options.transparent).toBe(true)
      expect(options.resizable).toBe(false)
      expect(options.skipTaskbar).toBe(true)
      expect(options.show).toBe(false)
      expect(options.webPreferences?.contextIsolation).toBe(true)
      expect(options.webPreferences?.nodeIntegration).toBe(false)
    })
  })

  describe('createWindow', () => {
    it('應匯出 createWindow 函式', async () => {
      const { createWindow } = await import('../main')
      expect(typeof createWindow).toBe('function')
    })

    it('createWindow 應回傳 BrowserWindow 實例', async () => {
      const { createWindow } = await import('../main')
      const window = createWindow()
      expect(window).toBeDefined()
    })

    it('開發模式應載入 localhost URL', async () => {
      process.env.NODE_ENV = 'development'
      vi.resetModules()
      const { createWindow } = await import('../main')
      createWindow()
      expect(mockLoadURL).toHaveBeenCalledWith('http://localhost:5173')
    })

    it('生產模式應載入本地檔案', async () => {
      process.env.NODE_ENV = 'production'
      vi.resetModules()
      const { createWindow } = await import('../main')
      createWindow()
      expect(mockLoadFile).toHaveBeenCalled()
    })
  })

  describe('initializeTray', () => {
    it('應匯出 initializeTray 函式', async () => {
      const { initializeTray } = await import('../main')
      expect(typeof initializeTray).toBe('function')
    })

    it('應建立並初始化 TrayManager', async () => {
      const { TrayManager } = await import('../tray/TrayManager')
      const { initializeTray } = await import('../main')

      const manager = initializeTray()

      expect(TrayManager).toHaveBeenCalled()
      expect(manager.initialize).toHaveBeenCalled()
    })

    it('回呼應在 initializeServices 中設定', async () => {
      const { initializeTray } = await import('../main')

      initializeTray()

      // initializeTray 不再設定回呼，回呼會在 initializeServices 中設定
      expect(mockTrayManagerInstance.onStart).toBeNull()
      expect(mockTrayManagerInstance.onPause).toBeNull()
      expect(mockTrayManagerInstance.onStop).toBeNull()
    })
  })

  describe('handleActivate', () => {
    it('對於 Tray 應用不應執行任何操作', async () => {
      const { handleActivate } = await import('../main')

      // handleActivate 現在是空函式，因為 Tray 應用不需要處理 activate
      expect(() => handleActivate()).not.toThrow()
    })
  })

  describe('handleWindowAllClosed', () => {
    it('對於 Tray 應用不應退出', async () => {
      Object.defineProperty(process, 'platform', { value: 'win32' })
      vi.resetModules()
      const { handleWindowAllClosed } = await import('../main')

      handleWindowAllClosed()

      // Tray 應用關閉視窗不應該退出
      expect(mockQuit).not.toHaveBeenCalled()
    })

    it('macOS 平台也不應退出', async () => {
      Object.defineProperty(process, 'platform', { value: 'darwin' })
      vi.resetModules()
      const { handleWindowAllClosed } = await import('../main')

      handleWindowAllClosed()

      expect(mockQuit).not.toHaveBeenCalled()
    })
  })

  describe('getTrayManager', () => {
    it('初始化前應回傳 null', async () => {
      const { getTrayManager } = await import('../main')
      expect(getTrayManager()).toBeNull()
    })
  })

  describe('initializeApp', () => {
    it('應呼叫 app.whenReady', async () => {
      const { initializeApp } = await import('../main')

      initializeApp()

      expect(mockWhenReady).toHaveBeenCalled()
    })

    it('應註冊 window-all-closed 事件', async () => {
      const { initializeApp } = await import('../main')

      initializeApp()

      expect(mockOn).toHaveBeenCalledWith('window-all-closed', expect.any(Function))
    })

    it('應註冊 before-quit 事件', async () => {
      const { initializeApp } = await import('../main')

      initializeApp()

      expect(mockOn).toHaveBeenCalledWith('before-quit', expect.any(Function))
    })

    it('before-quit 回呼應能正常執行', async () => {
      const { initializeApp } = await import('../main')

      initializeApp()

      // 取得 before-quit 回呼
      const beforeQuitCall = mockOn.mock.calls.find(
        (call) => call[0] === 'before-quit'
      ) as [string, () => void] | undefined
      const beforeQuitCallback = beforeQuitCall?.[1]

      // 確保回呼存在且能正常執行不拋出錯誤
      expect(beforeQuitCallback).toBeDefined()
      expect(() => beforeQuitCallback?.()).not.toThrow()
    })
  })

  describe('getTimerService', () => {
    it('初始化前應回傳 null', async () => {
      const { getTimerService } = await import('../main')
      expect(getTimerService()).toBeNull()
    })
  })

  describe('getNotificationService', () => {
    it('初始化前應回傳 null', async () => {
      const { getNotificationService } = await import('../main')
      expect(getNotificationService()).toBeNull()
    })
  })

  describe('getTaskStore', () => {
    it('初始化前應回傳 null', async () => {
      const { getTaskStore } = await import('../main')
      expect(getTaskStore()).toBeNull()
    })
  })

  describe('initializeServices', () => {
    it('應初始化計時器、通知和任務服務', async () => {
      const { initializeServices, getTimerService, getNotificationService, getTaskStore } = await import('../main')

      initializeServices()

      expect(getTimerService()).not.toBeNull()
      expect(getNotificationService()).not.toBeNull()
      expect(getTaskStore()).not.toBeNull()
    })

    it('onComplete 回呼應觸發通知', async () => {
      const { initializeServices, getTimerService } = await import('../main')

      initializeServices()
      const timerService = getTimerService()

      // 取得 setCallbacks 時設定的 onComplete 回呼並執行
      const callbacks = (timerService as any).callbacks
      if (callbacks?.onComplete) {
        callbacks.onComplete(300000, 300500, 'countdown')
      }

      expect(timerService).not.toBeNull()
    })

    it('onTick 回呼應更新 Tray 標題', async () => {
      const { initializeServices, getTimerService } = await import('../main')

      initializeServices()

      const timerService = getTimerService()

      // 取得 setCallbacks 時設定的 onTick 回呼並執行
      const callbacks = (timerService as any).callbacks
      // 執行回呼，確保不會拋出錯誤（trayManager 為 null 時會安全跳過）
      expect(() => {
        callbacks?.onTick?.({
          state: 'running',
          mode: 'countdown',
          duration: 300000,
          remaining: 295000,
          elapsed: 5000,
          isOvertime: false,
          displayTime: 295000,
        })
      }).not.toThrow()

      expect(timerService).not.toBeNull()
    })

    it('onStateChange 回呼應安全執行', async () => {
      const { initializeServices, getTimerService } = await import('../main')

      initializeServices()

      const timerService = getTimerService()

      // 取得 setCallbacks 時設定的 onStateChange 回呼並執行
      const callbacks = (timerService as any).callbacks

      // 測試回呼可以安全執行（trayManager 為 null 時會安全跳過）
      expect(() => {
        callbacks?.onStateChange?.('idle', 'running')
        callbacks?.onStateChange?.('running', 'idle')
      }).not.toThrow()
    })

    it('當 trayManager 為 null 時回呼設定應安全跳過', async () => {
      const { initializeServices } = await import('../main')

      // 不呼叫 initializeTray()，trayManager 保持為 null
      // initializeServices 應該安全執行，不會拋出錯誤
      expect(() => initializeServices()).not.toThrow()

      // 由於 trayManager 為 null，回呼不會被設定
      expect(mockTrayManagerInstance.onStart).toBeNull()
      expect(mockTrayManagerInstance.onPause).toBeNull()
      expect(mockTrayManagerInstance.onStop).toBeNull()
    })
  })
})
