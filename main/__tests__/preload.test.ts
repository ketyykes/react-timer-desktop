import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Electron modules
const mockExposeInMainWorld = vi.fn()
const mockSend = vi.fn()
const mockOn = vi.fn()

vi.mock('electron', () => ({
  contextBridge: {
    exposeInMainWorld: mockExposeInMainWorld,
  },
  ipcRenderer: {
    send: mockSend,
    on: mockOn,
  },
}))

describe('main/preload.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('應匯出 electronAPI 物件', async () => {
    const { electronAPI } = await import('../preload')
    expect(electronAPI).toBeDefined()
  })

  it('electronAPI 應包含 timer 物件', async () => {
    const { electronAPI } = await import('../preload')
    expect(electronAPI.timer).toBeDefined()
  })

  it('electronAPI 應包含 versions 物件', async () => {
    const { electronAPI } = await import('../preload')
    expect(electronAPI.versions).toBeDefined()
  })

  describe('timer API', () => {
    it('timer.start 應呼叫 ipcRenderer.send', async () => {
      const { electronAPI } = await import('../preload')
      electronAPI.timer.start(60)
      expect(mockSend).toHaveBeenCalledWith('timer:start', 60)
    })

    it('timer.pause 應呼叫 ipcRenderer.send', async () => {
      const { electronAPI } = await import('../preload')
      electronAPI.timer.pause()
      expect(mockSend).toHaveBeenCalledWith('timer:pause')
    })

    it('timer.resume 應呼叫 ipcRenderer.send', async () => {
      const { electronAPI } = await import('../preload')
      electronAPI.timer.resume()
      expect(mockSend).toHaveBeenCalledWith('timer:resume')
    })

    it('timer.stop 應呼叫 ipcRenderer.send', async () => {
      const { electronAPI } = await import('../preload')
      electronAPI.timer.stop()
      expect(mockSend).toHaveBeenCalledWith('timer:stop')
    })

    it('timer.onTick 應註冊 timer:tick 事件監聽', async () => {
      const { electronAPI } = await import('../preload')
      const callback = vi.fn()
      electronAPI.timer.onTick(callback)
      expect(mockOn).toHaveBeenCalledWith('timer:tick', expect.any(Function))
    })

    it('timer.onTick callback 應被正確呼叫', async () => {
      let capturedHandler: ((_event: unknown, remaining: number) => void) | null = null
      mockOn.mockImplementation((channel: string, handler: (_event: unknown, remaining: number) => void) => {
        if (channel === 'timer:tick') {
          capturedHandler = handler
        }
      })

      vi.resetModules()
      const { electronAPI } = await import('../preload')
      const callback = vi.fn()
      electronAPI.timer.onTick(callback)

      // 模擬 ipcRenderer 觸發事件
      if (capturedHandler) {
        capturedHandler({}, 30)
      }
      expect(callback).toHaveBeenCalledWith(30)
    })

    it('timer.onComplete 應註冊 timer:complete 事件監聽', async () => {
      const { electronAPI } = await import('../preload')
      const callback = vi.fn()
      electronAPI.timer.onComplete(callback)
      expect(mockOn).toHaveBeenCalledWith('timer:complete', expect.any(Function))
    })

    it('timer.onComplete callback 應被正確呼叫', async () => {
      let capturedHandler: (() => void) | null = null
      mockOn.mockImplementation((channel: string, handler: () => void) => {
        if (channel === 'timer:complete') {
          capturedHandler = handler
        }
      })

      vi.resetModules()
      const { electronAPI } = await import('../preload')
      const callback = vi.fn()
      electronAPI.timer.onComplete(callback)

      // 模擬 ipcRenderer 觸發事件
      if (capturedHandler) {
        capturedHandler()
      }
      expect(callback).toHaveBeenCalled()
    })
  })

  describe('versions API', () => {
    it('versions.node 應回傳 node 版本', async () => {
      const { electronAPI } = await import('../preload')
      const result = electronAPI.versions.node()
      expect(result).toBe(process.versions.node)
    })

    it('versions.chrome 應回傳 chrome 版本', async () => {
      const { electronAPI } = await import('../preload')
      const result = electronAPI.versions.chrome()
      expect(result).toBe(process.versions.chrome)
    })

    it('versions.electron 應回傳 electron 版本', async () => {
      const { electronAPI } = await import('../preload')
      const result = electronAPI.versions.electron()
      expect(result).toBe(process.versions.electron)
    })
  })

  describe('contextBridge', () => {
    it('應使用 contextBridge.exposeInMainWorld 暴露 API', async () => {
      await import('../preload')
      expect(mockExposeInMainWorld).toHaveBeenCalledWith(
        'electronAPI',
        expect.any(Object)
      )
    })
  })
})
