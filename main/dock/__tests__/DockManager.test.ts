import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock dock functions
const mockSetBadge = vi.fn()
const mockSetMenu = vi.fn()
const mockBuildFromTemplate = vi.fn().mockReturnValue({})

vi.mock('electron', () => ({
  app: {
    dock: {
      setBadge: mockSetBadge,
      setMenu: mockSetMenu,
    },
  },
  Menu: {
    buildFromTemplate: mockBuildFromTemplate,
  },
}))

describe('DockManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initialize', () => {
    it('sets up dock menu', async () => {
      const { DockManager } = await import('../DockManager')
      const manager = new DockManager()
      manager.initialize()
      expect(mockBuildFromTemplate).toHaveBeenCalled()
      expect(mockSetMenu).toHaveBeenCalled()
    })
  })

  describe('updateBadge', () => {
    it('shows remaining minutes when running', async () => {
      const { DockManager } = await import('../DockManager')
      const manager = new DockManager()
      manager.updateBadge('running', 150000, 0) // 2.5 minutes remaining
      expect(mockSetBadge).toHaveBeenCalledWith('3')
    })

    it('shows overtime badge with plus sign', async () => {
      const { DockManager } = await import('../DockManager')
      const manager = new DockManager()
      manager.updateBadge('overtime', 0, 180000) // 3 minutes overtime
      expect(mockSetBadge).toHaveBeenCalledWith('+3')
    })

    it('clears badge when idle', async () => {
      const { DockManager } = await import('../DockManager')
      const manager = new DockManager()
      manager.updateBadge('idle', 0, 0)
      expect(mockSetBadge).toHaveBeenCalledWith('')
    })

    it('shows remaining minutes when paused', async () => {
      const { DockManager } = await import('../DockManager')
      const manager = new DockManager()
      manager.updateBadge('paused', 90000, 0) // 1.5 minutes remaining
      expect(mockSetBadge).toHaveBeenCalledWith('2')
    })
  })

  describe('clearBadge', () => {
    it('sets empty badge', async () => {
      const { DockManager } = await import('../DockManager')
      const manager = new DockManager()
      manager.clearBadge()
      expect(mockSetBadge).toHaveBeenCalledWith('')
    })
  })

  describe('updateMenuForState', () => {
    it('updates menu with current state', async () => {
      const { DockManager } = await import('../DockManager')
      const manager = new DockManager()
      manager.initialize()
      vi.clearAllMocks()

      manager.updateMenuForState('running')
      expect(mockBuildFromTemplate).toHaveBeenCalled()
      expect(mockSetMenu).toHaveBeenCalled()
    })
  })

  describe('menu callbacks', () => {
    it('onStart callback is called from menu', async () => {
      const { DockManager } = await import('../DockManager')
      const manager = new DockManager()
      const mockOnStart = vi.fn()
      manager.onStart = mockOnStart

      manager.initialize()

      // Get menu template and trigger click
      const menuTemplate = mockBuildFromTemplate.mock.calls[0][0]
      const startItem = menuTemplate.find((item: { label: string }) => item.label === '開始計時')
      startItem?.click?.()

      expect(mockOnStart).toHaveBeenCalled()
    })

    it('onPause callback is called from menu', async () => {
      const { DockManager } = await import('../DockManager')
      const manager = new DockManager()
      const mockOnPause = vi.fn()
      manager.onPause = mockOnPause

      manager.initialize()

      const menuTemplate = mockBuildFromTemplate.mock.calls[0][0]
      const pauseItem = menuTemplate.find((item: { label: string }) => item.label === '暫停')
      pauseItem?.click?.()

      expect(mockOnPause).toHaveBeenCalled()
    })

    it('onStop callback is called from menu', async () => {
      const { DockManager } = await import('../DockManager')
      const manager = new DockManager()
      const mockOnStop = vi.fn()
      manager.onStop = mockOnStop

      manager.initialize()

      const menuTemplate = mockBuildFromTemplate.mock.calls[0][0]
      const stopItem = menuTemplate.find((item: { label: string }) => item.label === '停止')
      stopItem?.click?.()

      expect(mockOnStop).toHaveBeenCalled()
    })
  })
})
