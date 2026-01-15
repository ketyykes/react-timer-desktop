import { describe, it, expect, vi, beforeEach } from 'vitest'
import { IPC_CHANNELS, TimerData, TaskRecord } from '../../shared/types'

// Mock Electron modules
const mockExposeInMainWorld = vi.fn()
const mockInvoke = vi.fn()
const mockOn = vi.fn()
const mockRemoveListener = vi.fn()

vi.mock('electron', () => ({
  contextBridge: {
    exposeInMainWorld: mockExposeInMainWorld,
  },
  ipcRenderer: {
    invoke: mockInvoke,
    on: mockOn,
    removeListener: mockRemoveListener,
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

  it('electronAPI 應包含 task 物件', async () => {
    const { electronAPI } = await import('../preload')
    expect(electronAPI.task).toBeDefined()
  })

  describe('timer API', () => {
    const mockTimerData: TimerData = {
      state: 'running',
      duration: 60000,
      remaining: 59000,
      elapsed: 1000,
      isOvertime: false,
    }

    it('timer.start 應呼叫 ipcRenderer.invoke', async () => {
      mockInvoke.mockResolvedValue(mockTimerData)
      const { electronAPI } = await import('../preload')

      const result = await electronAPI.timer.start(60000)

      expect(mockInvoke).toHaveBeenCalledWith(IPC_CHANNELS.TIMER_START, 60000)
      expect(result).toEqual(mockTimerData)
    })

    it('timer.pause 應呼叫 ipcRenderer.invoke', async () => {
      mockInvoke.mockResolvedValue(mockTimerData)
      const { electronAPI } = await import('../preload')

      await electronAPI.timer.pause()

      expect(mockInvoke).toHaveBeenCalledWith(IPC_CHANNELS.TIMER_PAUSE)
    })

    it('timer.resume 應呼叫 ipcRenderer.invoke', async () => {
      mockInvoke.mockResolvedValue(mockTimerData)
      const { electronAPI } = await import('../preload')

      await electronAPI.timer.resume()

      expect(mockInvoke).toHaveBeenCalledWith(IPC_CHANNELS.TIMER_RESUME)
    })

    it('timer.stop 應呼叫 ipcRenderer.invoke', async () => {
      mockInvoke.mockResolvedValue(mockTimerData)
      const { electronAPI } = await import('../preload')

      await electronAPI.timer.stop()

      expect(mockInvoke).toHaveBeenCalledWith(IPC_CHANNELS.TIMER_STOP)
    })

    it('timer.reset 應呼叫 ipcRenderer.invoke', async () => {
      mockInvoke.mockResolvedValue(mockTimerData)
      const { electronAPI } = await import('../preload')

      await electronAPI.timer.reset()

      expect(mockInvoke).toHaveBeenCalledWith(IPC_CHANNELS.TIMER_RESET)
    })

    it('timer.onTick 應註冊事件監聽並回傳 cleanup 函式', async () => {
      const { electronAPI } = await import('../preload')
      const callback = vi.fn()

      const cleanup = electronAPI.timer.onTick(callback)

      expect(mockOn).toHaveBeenCalledWith(IPC_CHANNELS.TIMER_TICK, expect.any(Function))
      expect(typeof cleanup).toBe('function')

      // 測試 cleanup 函式
      cleanup()
      expect(mockRemoveListener).toHaveBeenCalledWith(IPC_CHANNELS.TIMER_TICK, expect.any(Function))
    })

    it('timer.onTick callback 應被正確呼叫', async () => {
      let capturedHandler: ((_event: unknown, data: TimerData) => void) | null = null
      mockOn.mockImplementation((channel: string, handler: (_event: unknown, data: TimerData) => void) => {
        if (channel === IPC_CHANNELS.TIMER_TICK) {
          capturedHandler = handler
        }
      })

      vi.resetModules()
      const { electronAPI } = await import('../preload')
      const callback = vi.fn()
      electronAPI.timer.onTick(callback)

      if (capturedHandler !== null) {
        (capturedHandler as (_event: unknown, data: unknown) => void)({}, mockTimerData)
      }
      expect(callback).toHaveBeenCalledWith(mockTimerData)
    })

    it('timer.onStateChange 應註冊事件監聽並回傳 cleanup 函式', async () => {
      const { electronAPI } = await import('../preload')
      const callback = vi.fn()

      const cleanup = electronAPI.timer.onStateChange(callback)

      expect(mockOn).toHaveBeenCalledWith(IPC_CHANNELS.TIMER_STATE_CHANGE, expect.any(Function))
      expect(typeof cleanup).toBe('function')

      cleanup()
      expect(mockRemoveListener).toHaveBeenCalledWith(IPC_CHANNELS.TIMER_STATE_CHANGE, expect.any(Function))
    })

    it('timer.onStateChange callback 應被正確呼叫', async () => {
      let capturedHandler: ((_event: unknown, data: unknown) => void) | null = null
      mockOn.mockImplementation((channel: string, handler: (_event: unknown, data: unknown) => void) => {
        if (channel === IPC_CHANNELS.TIMER_STATE_CHANGE) {
          capturedHandler = handler
        }
      })

      vi.resetModules()
      const { electronAPI } = await import('../preload')
      const callback = vi.fn()
      electronAPI.timer.onStateChange(callback)

      const stateChangeData = { previousState: 'idle', currentState: 'running' }
      if (capturedHandler !== null) {
        (capturedHandler as (_event: unknown, data: unknown) => void)({}, stateChangeData)
      }
      expect(callback).toHaveBeenCalledWith(stateChangeData)
    })

    it('timer.onComplete 應註冊事件監聽並回傳 cleanup 函式', async () => {
      const { electronAPI } = await import('../preload')
      const callback = vi.fn()

      const cleanup = electronAPI.timer.onComplete(callback)

      expect(mockOn).toHaveBeenCalledWith(IPC_CHANNELS.TIMER_COMPLETE, expect.any(Function))
      expect(typeof cleanup).toBe('function')

      cleanup()
      expect(mockRemoveListener).toHaveBeenCalledWith(IPC_CHANNELS.TIMER_COMPLETE, expect.any(Function))
    })

    it('timer.onComplete callback 應被正確呼叫', async () => {
      let capturedHandler: ((_event: unknown, data: unknown) => void) | null = null
      mockOn.mockImplementation((channel: string, handler: (_event: unknown, data: unknown) => void) => {
        if (channel === IPC_CHANNELS.TIMER_COMPLETE) {
          capturedHandler = handler
        }
      })

      vi.resetModules()
      const { electronAPI } = await import('../preload')
      const callback = vi.fn()
      electronAPI.timer.onComplete(callback)

      const completeData = { duration: 60000, actualElapsed: 60500 }
      if (capturedHandler !== null) {
        (capturedHandler as (_event: unknown, data: unknown) => void)({}, completeData)
      }
      expect(callback).toHaveBeenCalledWith(completeData)
    })
  })

  describe('task API', () => {
    const mockTask: Omit<TaskRecord, 'id' | 'createdAt'> = {
      name: '測試任務',
      duration: 300000,
      actualTime: 305000,
    }

    const mockTaskRecord: TaskRecord = {
      id: 'test-id',
      name: '測試任務',
      duration: 300000,
      actualTime: 305000,
      createdAt: Date.now(),
    }

    it('task.save 應呼叫 ipcRenderer.invoke', async () => {
      mockInvoke.mockResolvedValue(mockTaskRecord)
      const { electronAPI } = await import('../preload')

      const result = await electronAPI.task.save(mockTask)

      expect(mockInvoke).toHaveBeenCalledWith(IPC_CHANNELS.TASK_SAVE, mockTask)
      expect(result).toEqual(mockTaskRecord)
    })

    it('task.getAll 應呼叫 ipcRenderer.invoke', async () => {
      mockInvoke.mockResolvedValue([mockTaskRecord])
      const { electronAPI } = await import('../preload')

      const result = await electronAPI.task.getAll()

      expect(mockInvoke).toHaveBeenCalledWith(IPC_CHANNELS.TASK_GET_ALL)
      expect(result).toEqual([mockTaskRecord])
    })

    it('task.delete 應呼叫 ipcRenderer.invoke', async () => {
      mockInvoke.mockResolvedValue(true)
      const { electronAPI } = await import('../preload')

      const result = await electronAPI.task.delete('test-id')

      expect(mockInvoke).toHaveBeenCalledWith(IPC_CHANNELS.TASK_DELETE, 'test-id')
      expect(result).toBe(true)
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

  describe('型別匯出', () => {
    it('應匯出 TimerStateChangeData 型別', async () => {
      const module = await import('../preload')
      // 型別只存在於編譯時，這裡只是確認模組可以正確載入
      expect(module).toBeDefined()
    })

    it('應匯出 TimerCompleteData 型別', async () => {
      const module = await import('../preload')
      // 型別只存在於編譯時，這裡只是確認模組可以正確載入
      expect(module).toBeDefined()
    })
  })
})
