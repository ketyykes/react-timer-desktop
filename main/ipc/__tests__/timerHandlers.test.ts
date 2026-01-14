import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { IPC_CHANNELS } from '../../../shared/types'

// Mock ipcMain
const mockHandle = vi.fn()
const mockRemoveHandler = vi.fn()

vi.mock('electron', () => ({
  ipcMain: {
    handle: mockHandle,
    removeHandler: mockRemoveHandler,
  },
  BrowserWindow: vi.fn(),
}))

// Mock TimerService
const mockTimerServiceStart = vi.fn()
const mockTimerServicePause = vi.fn()
const mockTimerServiceResume = vi.fn()
const mockTimerServiceStop = vi.fn()
const mockTimerServiceReset = vi.fn()
const mockTimerServiceSetCallbacks = vi.fn()
const mockTimerServiceGetData = vi.fn(() => ({
  state: 'idle' as const,
  duration: 0,
  remaining: 0,
  elapsed: 0,
  isOvertime: false,
}))

const mockTimerService = {
  start: mockTimerServiceStart,
  pause: mockTimerServicePause,
  resume: mockTimerServiceResume,
  stop: mockTimerServiceStop,
  reset: mockTimerServiceReset,
  setCallbacks: mockTimerServiceSetCallbacks,
  getData: mockTimerServiceGetData,
}

describe('TimerIpcHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('register()', () => {
    it('應註冊所有 IPC handlers', async () => {
      const { TimerIpcHandler } = await import('../timerHandlers')
      const handler = new TimerIpcHandler(mockTimerService as any)

      handler.register()

      expect(mockHandle).toHaveBeenCalledWith(IPC_CHANNELS.TIMER_START, expect.any(Function))
      expect(mockHandle).toHaveBeenCalledWith(IPC_CHANNELS.TIMER_PAUSE, expect.any(Function))
      expect(mockHandle).toHaveBeenCalledWith(IPC_CHANNELS.TIMER_RESUME, expect.any(Function))
      expect(mockHandle).toHaveBeenCalledWith(IPC_CHANNELS.TIMER_STOP, expect.any(Function))
      expect(mockHandle).toHaveBeenCalledWith(IPC_CHANNELS.TIMER_RESET, expect.any(Function))
    })

    it('應設定 TimerService callbacks', async () => {
      const { TimerIpcHandler } = await import('../timerHandlers')
      const handler = new TimerIpcHandler(mockTimerService as any)

      handler.register()

      expect(mockTimerServiceSetCallbacks).toHaveBeenCalledWith({
        onTick: expect.any(Function),
        onStateChange: expect.any(Function),
        onComplete: expect.any(Function),
      })
    })
  })

  describe('IPC handler callbacks', () => {
    it('TIMER_START handler 應呼叫 timerService.start', async () => {
      const { TimerIpcHandler } = await import('../timerHandlers')
      const handler = new TimerIpcHandler(mockTimerService as any)

      handler.register()

      // 取得註冊的 callback
      const startHandler = mockHandle.mock.calls.find(
        (call) => call[0] === IPC_CHANNELS.TIMER_START
      )?.[1]

      const result = startHandler({}, 60000)

      expect(mockTimerServiceStart).toHaveBeenCalledWith(60000)
      expect(mockTimerServiceGetData).toHaveBeenCalled()
      expect(result).toEqual({
        state: 'idle',
        duration: 0,
        remaining: 0,
        elapsed: 0,
        isOvertime: false,
      })
    })

    it('TIMER_PAUSE handler 應呼叫 timerService.pause', async () => {
      const { TimerIpcHandler } = await import('../timerHandlers')
      const handler = new TimerIpcHandler(mockTimerService as any)

      handler.register()

      const pauseHandler = mockHandle.mock.calls.find(
        (call) => call[0] === IPC_CHANNELS.TIMER_PAUSE
      )?.[1]

      pauseHandler()

      expect(mockTimerServicePause).toHaveBeenCalled()
    })

    it('TIMER_RESUME handler 應呼叫 timerService.resume', async () => {
      const { TimerIpcHandler } = await import('../timerHandlers')
      const handler = new TimerIpcHandler(mockTimerService as any)

      handler.register()

      const resumeHandler = mockHandle.mock.calls.find(
        (call) => call[0] === IPC_CHANNELS.TIMER_RESUME
      )?.[1]

      resumeHandler()

      expect(mockTimerServiceResume).toHaveBeenCalled()
    })

    it('TIMER_STOP handler 應呼叫 timerService.stop', async () => {
      const { TimerIpcHandler } = await import('../timerHandlers')
      const handler = new TimerIpcHandler(mockTimerService as any)

      handler.register()

      const stopHandler = mockHandle.mock.calls.find(
        (call) => call[0] === IPC_CHANNELS.TIMER_STOP
      )?.[1]

      stopHandler()

      expect(mockTimerServiceStop).toHaveBeenCalled()
    })

    it('TIMER_RESET handler 應呼叫 timerService.reset', async () => {
      const { TimerIpcHandler } = await import('../timerHandlers')
      const handler = new TimerIpcHandler(mockTimerService as any)

      handler.register()

      const resetHandler = mockHandle.mock.calls.find(
        (call) => call[0] === IPC_CHANNELS.TIMER_RESET
      )?.[1]

      resetHandler()

      expect(mockTimerServiceReset).toHaveBeenCalled()
    })
  })

  describe('unregister()', () => {
    it('應移除所有 IPC handlers', async () => {
      const { TimerIpcHandler } = await import('../timerHandlers')
      const handler = new TimerIpcHandler(mockTimerService as any)

      handler.unregister()

      expect(mockRemoveHandler).toHaveBeenCalledWith(IPC_CHANNELS.TIMER_START)
      expect(mockRemoveHandler).toHaveBeenCalledWith(IPC_CHANNELS.TIMER_PAUSE)
      expect(mockRemoveHandler).toHaveBeenCalledWith(IPC_CHANNELS.TIMER_RESUME)
      expect(mockRemoveHandler).toHaveBeenCalledWith(IPC_CHANNELS.TIMER_STOP)
      expect(mockRemoveHandler).toHaveBeenCalledWith(IPC_CHANNELS.TIMER_RESET)
    })
  })

  describe('setMainWindow()', () => {
    it('應設定主視窗', async () => {
      const { TimerIpcHandler } = await import('../timerHandlers')
      const handler = new TimerIpcHandler(mockTimerService as any)

      const mockWindow = { webContents: { send: vi.fn() }, isDestroyed: () => false }

      handler.setMainWindow(mockWindow as any)

      // 驗證設定成功（透過 callbacks 測試）
      handler.register()

      // 取得 onTick callback
      const callbacks = mockTimerServiceSetCallbacks.mock.calls[0][0]
      callbacks.onTick({ state: 'running', duration: 60000, remaining: 59000, elapsed: 1000, isOvertime: false })

      expect(mockWindow.webContents.send).toHaveBeenCalledWith(
        IPC_CHANNELS.TIMER_TICK,
        expect.any(Object)
      )
    })

    it('視窗為 null 時不應發送訊息', async () => {
      const { TimerIpcHandler } = await import('../timerHandlers')
      const handler = new TimerIpcHandler(mockTimerService as any)

      handler.setMainWindow(null)
      handler.register()

      const callbacks = mockTimerServiceSetCallbacks.mock.calls[0][0]

      // 不應拋出錯誤
      expect(() => callbacks.onTick({ state: 'running' })).not.toThrow()
    })

    it('視窗已銷毀時不應發送訊息', async () => {
      const { TimerIpcHandler } = await import('../timerHandlers')
      const handler = new TimerIpcHandler(mockTimerService as any)

      const mockWindow = { webContents: { send: vi.fn() }, isDestroyed: () => true }
      handler.setMainWindow(mockWindow as any)
      handler.register()

      const callbacks = mockTimerServiceSetCallbacks.mock.calls[0][0]
      callbacks.onTick({ state: 'running' })

      expect(mockWindow.webContents.send).not.toHaveBeenCalled()
    })
  })

  describe('sendToRenderer callbacks', () => {
    it('onStateChange 應發送 TIMER_STATE_CHANGE 事件', async () => {
      const { TimerIpcHandler } = await import('../timerHandlers')
      const handler = new TimerIpcHandler(mockTimerService as any)

      const mockWindow = { webContents: { send: vi.fn() }, isDestroyed: () => false }
      handler.setMainWindow(mockWindow as any)
      handler.register()

      const callbacks = mockTimerServiceSetCallbacks.mock.calls[0][0]
      callbacks.onStateChange('idle', 'running')

      expect(mockWindow.webContents.send).toHaveBeenCalledWith(
        IPC_CHANNELS.TIMER_STATE_CHANGE,
        { previousState: 'idle', currentState: 'running' }
      )
    })

    it('onComplete 應發送 TIMER_COMPLETE 事件', async () => {
      const { TimerIpcHandler } = await import('../timerHandlers')
      const handler = new TimerIpcHandler(mockTimerService as any)

      const mockWindow = { webContents: { send: vi.fn() }, isDestroyed: () => false }
      handler.setMainWindow(mockWindow as any)
      handler.register()

      const callbacks = mockTimerServiceSetCallbacks.mock.calls[0][0]
      callbacks.onComplete(60000, 60500)

      expect(mockWindow.webContents.send).toHaveBeenCalledWith(
        IPC_CHANNELS.TIMER_COMPLETE,
        { duration: 60000, actualElapsed: 60500 }
      )
    })
  })

  describe('getTimerService()', () => {
    it('應回傳 TimerService 實例', async () => {
      const { TimerIpcHandler } = await import('../timerHandlers')
      const handler = new TimerIpcHandler(mockTimerService as any)

      expect(handler.getTimerService()).toBe(mockTimerService)
    })
  })

  describe('createTimerIpcHandler()', () => {
    it('應建立 TimerIpcHandler 實例', async () => {
      const { createTimerIpcHandler, TimerIpcHandler } = await import('../timerHandlers')

      const handler = createTimerIpcHandler(mockTimerService as any)

      expect(handler).toBeInstanceOf(TimerIpcHandler)
    })
  })
})
