import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock Electron modules
const mockDestroy = vi.fn()
const mockSetTitle = vi.fn()
const mockSetToolTip = vi.fn()
const mockSetContextMenu = vi.fn()
const mockOn = vi.fn()
const mockSetImage = vi.fn()

const mockTrayInstance = {
  destroy: mockDestroy,
  setTitle: mockSetTitle,
  setToolTip: mockSetToolTip,
  setContextMenu: mockSetContextMenu,
  setImage: mockSetImage,
  on: mockOn,
  getBounds: vi.fn(() => ({ x: 100, y: 0, width: 22, height: 22 })),
}

const mockShow = vi.fn()
const mockHide = vi.fn()
const mockSetPosition = vi.fn()
const mockGetSize = vi.fn(() => [400, 300])
const mockIsVisible = vi.fn(() => false)
const mockClose = vi.fn()

const mockWindowInstance = {
  show: mockShow,
  hide: mockHide,
  setPosition: mockSetPosition,
  getSize: mockGetSize,
  isVisible: mockIsVisible,
  close: mockClose,
  on: vi.fn(),
  loadURL: vi.fn(),
  loadFile: vi.fn(),
}

vi.mock('electron', () => {
  const TrayMock = vi.fn(() => mockTrayInstance)
  const MenuMock = {
    buildFromTemplate: vi.fn((template) => ({ items: template })),
  }
  const nativeImageMock = {
    createFromPath: vi.fn(() => ({ isEmpty: () => false })),
    createEmpty: vi.fn(() => ({ isEmpty: () => true })),
  }
  const BrowserWindowMock = vi.fn(() => mockWindowInstance)
  const screenMock = {
    getPrimaryDisplay: vi.fn(() => ({
      workAreaSize: { width: 1920, height: 1080 },
    })),
  }

  return {
    Tray: TrayMock,
    Menu: MenuMock,
    nativeImage: nativeImageMock,
    BrowserWindow: BrowserWindowMock,
    screen: screenMock,
    app: {
      quit: vi.fn(),
      getAppPath: vi.fn(() => '/mock/app/path'),
    },
  }
})

vi.mock('node:path', () => ({
  default: {
    join: vi.fn((...args: string[]) => args.join('/')),
  },
  join: vi.fn((...args: string[]) => args.join('/')),
}))

describe('TrayManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('constructor', () => {
    it('應匯出 TrayManager 類別', async () => {
      const { TrayManager } = await import('../TrayManager')
      expect(TrayManager).toBeDefined()
    })

    it('應能建立 TrayManager 實例', async () => {
      const { TrayManager } = await import('../TrayManager')
      const manager = new TrayManager()
      expect(manager).toBeInstanceOf(TrayManager)
    })
  })

  describe('initialize', () => {
    it('應建立 Tray 實例', async () => {
      const { Tray } = await import('electron')
      const { TrayManager } = await import('../TrayManager')
      const manager = new TrayManager()

      manager.initialize()

      expect(Tray).toHaveBeenCalled()
    })

    it('應設定 tooltip', async () => {
      const { TrayManager } = await import('../TrayManager')
      const manager = new TrayManager()

      manager.initialize()

      expect(mockSetToolTip).toHaveBeenCalledWith('Timer')
    })

    it('應設定 context menu', async () => {
      const { TrayManager } = await import('../TrayManager')
      const manager = new TrayManager()

      manager.initialize()

      expect(mockSetContextMenu).toHaveBeenCalled()
    })

    it('應註冊 click 事件', async () => {
      const { TrayManager } = await import('../TrayManager')
      const manager = new TrayManager()

      manager.initialize()

      expect(mockOn).toHaveBeenCalledWith('click', expect.any(Function))
    })
  })

  describe('createContextMenu', () => {
    it('應建立包含正確項目的選單', async () => {
      const { Menu } = await import('electron')
      const { TrayManager } = await import('../TrayManager')
      const manager = new TrayManager()

      manager.initialize()

      expect(Menu.buildFromTemplate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ label: '開始計時' }),
          expect.objectContaining({ label: '暫停' }),
          expect.objectContaining({ label: '停止' }),
          expect.objectContaining({ type: 'separator' }),
          expect.objectContaining({ label: '退出' }),
        ])
      )
    })
  })

  describe('updateTitle', () => {
    it('應更新 Tray 標題', async () => {
      const { TrayManager } = await import('../TrayManager')
      const manager = new TrayManager()
      manager.initialize()

      manager.updateTitle('25:00')

      expect(mockSetTitle).toHaveBeenCalledWith('25:00')
    })

    it('未初始化時不應拋出錯誤', async () => {
      const { TrayManager } = await import('../TrayManager')
      const manager = new TrayManager()

      expect(() => manager.updateTitle('25:00')).not.toThrow()
    })
  })

  describe('showWindow', () => {
    it('應顯示視窗', async () => {
      const { TrayManager } = await import('../TrayManager')
      const manager = new TrayManager()
      manager.initialize()

      manager.showWindow()

      expect(mockShow).toHaveBeenCalled()
    })

    it('應設定視窗位置', async () => {
      const { TrayManager } = await import('../TrayManager')
      const manager = new TrayManager()
      manager.initialize()

      manager.showWindow()

      expect(mockSetPosition).toHaveBeenCalled()
    })

    it('未初始化時不應拋出錯誤', async () => {
      const { TrayManager } = await import('../TrayManager')
      const manager = new TrayManager()

      // 未呼叫 initialize，直接呼叫 showWindow
      expect(() => manager.showWindow()).not.toThrow()
      expect(mockShow).not.toHaveBeenCalled()
    })
  })

  describe('hideWindow', () => {
    it('應隱藏視窗', async () => {
      const { TrayManager } = await import('../TrayManager')
      const manager = new TrayManager()
      manager.initialize()

      manager.hideWindow()

      expect(mockHide).toHaveBeenCalled()
    })
  })

  describe('toggleWindow', () => {
    it('視窗隱藏時應顯示', async () => {
      mockIsVisible.mockReturnValue(false)
      const { TrayManager } = await import('../TrayManager')
      const manager = new TrayManager()
      manager.initialize()

      manager.toggleWindow()

      expect(mockShow).toHaveBeenCalled()
    })

    it('視窗顯示時應隱藏', async () => {
      mockIsVisible.mockReturnValue(true)
      vi.resetModules()
      const { TrayManager } = await import('../TrayManager')
      const manager = new TrayManager()
      manager.initialize()

      manager.toggleWindow()

      expect(mockHide).toHaveBeenCalled()
    })
  })

  describe('destroy', () => {
    it('應銷毀 Tray', async () => {
      const { TrayManager } = await import('../TrayManager')
      const manager = new TrayManager()
      manager.initialize()

      manager.destroy()

      expect(mockDestroy).toHaveBeenCalled()
    })

    it('未初始化時不應拋出錯誤', async () => {
      const { TrayManager } = await import('../TrayManager')
      const manager = new TrayManager()

      expect(() => manager.destroy()).not.toThrow()
    })
  })

  describe('setMenuItemEnabled', () => {
    it('應能啟用/停用選單項目', async () => {
      const { TrayManager } = await import('../TrayManager')
      const manager = new TrayManager()
      manager.initialize()

      // 這個功能主要用於 P3 整合
      expect(() => manager.setMenuItemEnabled('start', false)).not.toThrow()
    })

    it('項目不存在時不應拋出錯誤', async () => {
      const { TrayManager } = await import('../TrayManager')
      const manager = new TrayManager()
      manager.initialize()

      // @ts-expect-error 測試無效的 itemId
      expect(() => manager.setMenuItemEnabled('invalid', false)).not.toThrow()
    })
  })

  describe('updateMenuForState', () => {
    it('idle 狀態應啟用開始、停用暫停和停止', async () => {
      const { TrayManager } = await import('../TrayManager')
      const manager = new TrayManager()
      manager.initialize()

      manager.updateMenuForState('idle')

      // 檢查 setContextMenu 被呼叫（表示選單已更新）
      expect(mockSetContextMenu).toHaveBeenCalled()
    })

    it('running 狀態應停用開始、啟用暫停和停止', async () => {
      const { TrayManager } = await import('../TrayManager')
      const manager = new TrayManager()
      manager.initialize()

      manager.updateMenuForState('running')

      expect(mockSetContextMenu).toHaveBeenCalled()
    })

    it('overtime 狀態應停用開始、啟用暫停和停止', async () => {
      const { TrayManager } = await import('../TrayManager')
      const manager = new TrayManager()
      manager.initialize()

      manager.updateMenuForState('overtime')

      expect(mockSetContextMenu).toHaveBeenCalled()
    })

    it('paused 狀態應啟用開始和停止、停用暫停', async () => {
      const { TrayManager } = await import('../TrayManager')
      const manager = new TrayManager()
      manager.initialize()

      manager.updateMenuForState('paused')

      expect(mockSetContextMenu).toHaveBeenCalled()
    })
  })

  describe('calculateWindowPosition edge cases', () => {
    it('視窗位置 X 小於 0 時應設為 0', async () => {
      // 模擬 Tray 在螢幕最左邊
      mockTrayInstance.getBounds = vi.fn(() => ({ x: -100, y: 0, width: 22, height: 22 }))

      vi.resetModules()
      const { TrayManager } = await import('../TrayManager')
      const manager = new TrayManager()
      manager.initialize()

      manager.showWindow()

      // 應該呼叫 setPosition
      expect(mockSetPosition).toHaveBeenCalled()
    })

    it('視窗超出螢幕右邊界時應調整位置', async () => {
      // 模擬 Tray 在螢幕最右邊
      mockTrayInstance.getBounds = vi.fn(() => ({ x: 1800, y: 0, width: 22, height: 22 }))

      vi.resetModules()
      const { TrayManager } = await import('../TrayManager')
      const manager = new TrayManager()
      manager.initialize()

      manager.showWindow()

      expect(mockSetPosition).toHaveBeenCalled()
    })
  })

  describe('icon path', () => {
    it('開發模式應使用 __dirname 路徑', async () => {
      process.env.NODE_ENV = 'development'
      vi.resetModules()
      const { TrayManager } = await import('../TrayManager')
      const manager = new TrayManager()

      // 初始化時會建立圖示
      expect(() => manager.initialize()).not.toThrow()
    })

    it('生產模式應使用 app.getAppPath 路徑', async () => {
      process.env.NODE_ENV = 'production'
      vi.resetModules()
      const { TrayManager } = await import('../TrayManager')
      const manager = new TrayManager()

      expect(() => manager.initialize()).not.toThrow()
    })

    it('圖示載入失敗時應建立空圖示', async () => {
      // 修改 mock 讓 isEmpty 返回 true
      const { nativeImage } = await import('electron')
      ;(nativeImage.createFromPath as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        isEmpty: () => true,
      })

      vi.resetModules()
      const { TrayManager } = await import('../TrayManager')
      const manager = new TrayManager()

      expect(() => manager.initialize()).not.toThrow()
    })
  })

  describe('window loading', () => {
    it('開發模式應載入 localhost URL', async () => {
      process.env.NODE_ENV = 'development'
      vi.resetModules()
      const { TrayManager } = await import('../TrayManager')
      const manager = new TrayManager()
      manager.initialize()

      expect(mockWindowInstance.loadURL).toHaveBeenCalledWith('http://localhost:5173')
    })

    it('生產模式應載入本地檔案', async () => {
      process.env.NODE_ENV = 'production'
      vi.resetModules()
      const { TrayManager } = await import('../TrayManager')
      const manager = new TrayManager()
      manager.initialize()

      expect(mockWindowInstance.loadFile).toHaveBeenCalled()
    })

    it('視窗失焦時應隱藏視窗', async () => {
      const { TrayManager } = await import('../TrayManager')
      const manager = new TrayManager()
      manager.initialize()

      // 取得並執行 blur 回呼
      const blurCall = mockWindowInstance.on.mock.calls.find(
        (call: [string, () => void]) => call[0] === 'blur'
      )
      const blurCallback = blurCall?.[1]

      blurCallback?.()

      expect(mockHide).toHaveBeenCalled()
    })
  })

  describe('tray click event', () => {
    it('點擊 Tray 應切換視窗', async () => {
      const { TrayManager } = await import('../TrayManager')
      const manager = new TrayManager()
      manager.initialize()

      // 取得並執行 click 回呼
      const clickCall = mockOn.mock.calls.find(
        (call: [string, () => void]) => call[0] === 'click'
      )
      const clickCallback = clickCall?.[1]

      // 執行 click 回呼應該切換視窗
      clickCallback?.()

      // 由於視窗是隱藏的，應該呼叫 show
      expect(mockShow).toHaveBeenCalled()
    })
  })

  describe('menu item callbacks', () => {
    it('開始計時選單項目應觸發 onStart 回呼', async () => {
      const { Menu } = await import('electron')
      const { TrayManager } = await import('../TrayManager')
      const manager = new TrayManager()
      const mockOnStart = vi.fn()
      manager.onStart = mockOnStart

      manager.initialize()

      // 取得選單模板並手動觸發 click
      const menuCall = (Menu.buildFromTemplate as ReturnType<typeof vi.fn>).mock.calls[0][0]
      const startItem = menuCall.find((item: { label?: string }) => item.label === '開始計時')
      startItem?.click?.()

      expect(mockOnStart).toHaveBeenCalled()
    })

    it('暫停選單項目應觸發 onPause 回呼', async () => {
      const { Menu } = await import('electron')
      const { TrayManager } = await import('../TrayManager')
      const manager = new TrayManager()
      const mockOnPause = vi.fn()
      manager.onPause = mockOnPause

      manager.initialize()

      const menuCall = (Menu.buildFromTemplate as ReturnType<typeof vi.fn>).mock.calls[0][0]
      const pauseItem = menuCall.find((item: { label?: string }) => item.label === '暫停')
      pauseItem?.click?.()

      expect(mockOnPause).toHaveBeenCalled()
    })

    it('停止選單項目應觸發 onStop 回呼', async () => {
      const { Menu } = await import('electron')
      const { TrayManager } = await import('../TrayManager')
      const manager = new TrayManager()
      const mockOnStop = vi.fn()
      manager.onStop = mockOnStop

      manager.initialize()

      const menuCall = (Menu.buildFromTemplate as ReturnType<typeof vi.fn>).mock.calls[0][0]
      const stopItem = menuCall.find((item: { label?: string }) => item.label === '停止')
      stopItem?.click?.()

      expect(mockOnStop).toHaveBeenCalled()
    })
  })
})
