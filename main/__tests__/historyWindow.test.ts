import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { BrowserWindow, ipcMain } from 'electron'

// Mock Electron
vi.mock('electron', () => {
  const mockWindow = {
    loadFile: vi.fn(),
    loadURL: vi.fn(),
    show: vi.fn(),
    on: vi.fn(),
    focus: vi.fn(),
    isDestroyed: vi.fn(() => false),
  }

  return {
    BrowserWindow: vi.fn(() => mockWindow),
    ipcMain: {
      handle: vi.fn(),
      removeHandler: vi.fn(),
    },
  }
})

describe('historyWindow', () => {
  let createHistoryWindow: typeof import('../historyWindow').createHistoryWindow
  let getHistoryWindow: typeof import('../historyWindow').getHistoryWindow
  let registerHistoryHandlers: typeof import('../historyWindow').registerHistoryHandlers
  let unregisterHistoryHandlers: typeof import('../historyWindow').unregisterHistoryHandlers

  beforeEach(async () => {
    vi.clearAllMocks()
    vi.resetModules()

    // 每次測試重新載入模組以重置 historyWindow 狀態
    const module = await import('../historyWindow')
    createHistoryWindow = module.createHistoryWindow
    getHistoryWindow = module.getHistoryWindow
    registerHistoryHandlers = module.registerHistoryHandlers
    unregisterHistoryHandlers = module.unregisterHistoryHandlers
  })

  afterEach(() => {
    vi.resetModules()
  })

  describe('createHistoryWindow', () => {
    it('應該建立 BrowserWindow 並設定正確的選項', () => {
      createHistoryWindow()

      expect(BrowserWindow).toHaveBeenCalledWith(
        expect.objectContaining({
          width: 400,
          height: 500,
          title: '歷史記錄',
          webPreferences: expect.objectContaining({
            contextIsolation: true,
            nodeIntegration: false,
          }),
        })
      )
    })

    it('再次呼叫應該 focus 現有視窗而非建立新的', () => {
      const window1 = createHistoryWindow()
      const window2 = createHistoryWindow()

      // 只建立一次
      expect(BrowserWindow).toHaveBeenCalledTimes(1)
      expect(window1).toBe(window2)
      expect(window1.focus).toHaveBeenCalled()
    })

    it('如果視窗已被銷毀應該建立新的視窗', async () => {
      vi.resetModules()

      // 第一次呼叫：視窗未銷毀
      const mockWindow1 = {
        loadFile: vi.fn(),
        loadURL: vi.fn(),
        show: vi.fn(),
        on: vi.fn(),
        focus: vi.fn(),
        isDestroyed: vi.fn(() => false),
      }

      // 第二次呼叫：視窗已銷毀，應建立新視窗
      const mockWindow2 = {
        loadFile: vi.fn(),
        loadURL: vi.fn(),
        show: vi.fn(),
        on: vi.fn(),
        focus: vi.fn(),
        isDestroyed: vi.fn(() => false),
      }

      let callCount = 0
      vi.mocked(BrowserWindow).mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return mockWindow1 as unknown as BrowserWindow
        }
        return mockWindow2 as unknown as BrowserWindow
      })

      const module = await import('../historyWindow')

      // 第一次建立
      const window1 = module.createHistoryWindow()
      expect(window1).toBe(mockWindow1)

      // 模擬視窗銷毀
      mockWindow1.isDestroyed.mockReturnValue(true)

      // 第二次建立應該建立新視窗
      const window3 = module.createHistoryWindow()
      expect(window3).toBe(mockWindow2)
      expect(BrowserWindow).toHaveBeenCalledTimes(2)
    })

    it('應該監聽 closed 事件', () => {
      const window = createHistoryWindow()
      expect(window.on).toHaveBeenCalledWith('closed', expect.any(Function))
    })
  })

  describe('getHistoryWindow', () => {
    it('建立視窗前應該回傳 null', () => {
      expect(getHistoryWindow()).toBeNull()
    })

    it('建立視窗後應該回傳視窗實例', () => {
      const window = createHistoryWindow()
      expect(getHistoryWindow()).toBe(window)
    })
  })

  describe('registerHistoryHandlers', () => {
    it('應該註冊 HISTORY_OPEN handler', () => {
      registerHistoryHandlers()

      expect(ipcMain.handle).toHaveBeenCalledWith('history:open', expect.any(Function))
    })
  })

  describe('unregisterHistoryHandlers', () => {
    it('應該移除 HISTORY_OPEN handler', () => {
      unregisterHistoryHandlers()

      expect(ipcMain.removeHandler).toHaveBeenCalledWith('history:open')
    })
  })
})
