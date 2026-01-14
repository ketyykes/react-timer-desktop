import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock Electron modules
const mockLoadURL = vi.fn()
const mockLoadFile = vi.fn()
const mockGetAllWindows = vi.fn(() => [])
const mockQuit = vi.fn()
const mockOn = vi.fn()
const mockWhenReady = vi.fn(() => Promise.resolve())

vi.mock('electron', () => ({
  app: {
    whenReady: mockWhenReady,
    on: mockOn,
    quit: mockQuit,
  },
  BrowserWindow: vi.fn().mockImplementation(() => ({
    loadURL: mockLoadURL,
    loadFile: mockLoadFile,
    on: vi.fn(),
    show: vi.fn(),
    hide: vi.fn(),
    close: vi.fn(),
  })),
}))

// 讓 BrowserWindow.getAllWindows 可以被 mock
vi.mock('electron', async () => {
  const BrowserWindowMock = vi.fn().mockImplementation(() => ({
    loadURL: mockLoadURL,
    loadFile: mockLoadFile,
    on: vi.fn(),
    show: vi.fn(),
    hide: vi.fn(),
    close: vi.fn(),
  }))
  // 添加靜態方法
  ;(BrowserWindowMock as unknown as { getAllWindows: typeof mockGetAllWindows }).getAllWindows = mockGetAllWindows

  return {
    app: {
      whenReady: mockWhenReady,
      on: mockOn,
      quit: mockQuit,
    },
    BrowserWindow: BrowserWindowMock,
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

  describe('handleActivate', () => {
    it('沒有視窗時應建立新視窗', async () => {
      mockGetAllWindows.mockReturnValue([])
      const { handleActivate } = await import('../main')
      const { BrowserWindow } = await import('electron')

      handleActivate()

      expect(BrowserWindow).toHaveBeenCalled()
    })

    it('有視窗時不應建立新視窗', async () => {
      mockGetAllWindows.mockReturnValue([{}])
      vi.resetModules()
      const { handleActivate } = await import('../main')
      const { BrowserWindow } = await import('electron')

      const callCountBefore = (BrowserWindow as unknown as { mock: { calls: unknown[] } }).mock.calls.length
      handleActivate()
      const callCountAfter = (BrowserWindow as unknown as { mock: { calls: unknown[] } }).mock.calls.length

      // 呼叫次數應相同（因為 handleActivate 不應建立新視窗）
      expect(callCountAfter - callCountBefore).toBe(0)
    })
  })

  describe('handleWindowAllClosed', () => {
    it('非 macOS 平台應呼叫 app.quit', async () => {
      Object.defineProperty(process, 'platform', { value: 'win32' })
      vi.resetModules()
      const { handleWindowAllClosed } = await import('../main')

      handleWindowAllClosed()

      expect(mockQuit).toHaveBeenCalled()
    })

    it('macOS 平台不應呼叫 app.quit', async () => {
      Object.defineProperty(process, 'platform', { value: 'darwin' })
      vi.resetModules()
      const { handleWindowAllClosed } = await import('../main')

      handleWindowAllClosed()

      expect(mockQuit).not.toHaveBeenCalled()
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
  })
})
