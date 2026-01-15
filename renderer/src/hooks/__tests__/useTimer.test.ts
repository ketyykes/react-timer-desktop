import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useTimer } from '../useTimer'
import type { TimerData, TimerState, TimerMode } from '../../../../shared/types'

// Mock Electron API
const mockStart = vi.fn()
const mockPause = vi.fn()
const mockResume = vi.fn()
const mockStop = vi.fn()
const mockReset = vi.fn()
const mockOnTick = vi.fn()
const mockOnStateChange = vi.fn()
const mockOnComplete = vi.fn()

const mockTimerAPI = {
  start: mockStart,
  pause: mockPause,
  resume: mockResume,
  stop: mockStop,
  reset: mockReset,
  onTick: mockOnTick,
  onStateChange: mockOnStateChange,
  onComplete: mockOnComplete,
}

describe('useTimer', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // 設定預設的 cleanup 函式
    mockOnTick.mockReturnValue(vi.fn())
    mockOnStateChange.mockReturnValue(vi.fn())
    mockOnComplete.mockReturnValue(vi.fn())

    // 設定 window.electronAPI
    Object.defineProperty(window, 'electronAPI', {
      value: { timer: mockTimerAPI },
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    // 清除 window.electronAPI
    Object.defineProperty(window, 'electronAPI', {
      value: undefined,
      writable: true,
      configurable: true,
    })
  })

  describe('initial state', () => {
    it('應初始化為 idle 狀態', () => {
      const { result } = renderHook(() => useTimer())

      expect(result.current.state).toBe('idle')
      expect(result.current.mode).toBe('countdown')
      expect(result.current.duration).toBe(0)
      expect(result.current.remaining).toBe(0)
      expect(result.current.elapsed).toBe(0)
      expect(result.current.isOvertime).toBe(false)
      expect(result.current.displayTime).toBe(0)
    })

    it('應回傳所有控制方法', () => {
      const { result } = renderHook(() => useTimer())

      expect(typeof result.current.start).toBe('function')
      expect(typeof result.current.pause).toBe('function')
      expect(typeof result.current.resume).toBe('function')
      expect(typeof result.current.stop).toBe('function')
      expect(typeof result.current.reset).toBe('function')
    })
  })

  describe('start()', () => {
    it('應呼叫 API 並更新狀態（預設 countdown 模式）', async () => {
      const mockData: TimerData = {
        state: 'running',
        mode: 'countdown',
        duration: 60000,
        remaining: 60000,
        elapsed: 0,
        isOvertime: false,
        displayTime: 60000,
      }
      mockStart.mockResolvedValue(mockData)

      const { result } = renderHook(() => useTimer())

      await act(async () => {
        await result.current.start(60000)
      })

      expect(mockStart).toHaveBeenCalledWith(60000, 'countdown')
      expect(result.current.state).toBe('running')
      expect(result.current.mode).toBe('countdown')
      expect(result.current.duration).toBe(60000)
    })

    it('應支援 countup 模式', async () => {
      const mockData: TimerData = {
        state: 'running',
        mode: 'countup',
        duration: 60000,
        remaining: -60000,
        elapsed: 0,
        isOvertime: false,
        displayTime: 0,
      }
      mockStart.mockResolvedValue(mockData)

      const { result } = renderHook(() => useTimer())

      await act(async () => {
        await result.current.start(60000, 'countup')
      })

      expect(mockStart).toHaveBeenCalledWith(60000, 'countup')
      expect(result.current.mode).toBe('countup')
    })
  })

  describe('pause()', () => {
    it('應呼叫 API 並更新狀態', async () => {
      const mockData: TimerData = {
        state: 'paused',
        mode: 'countdown',
        duration: 60000,
        remaining: 55000,
        elapsed: 5000,
        isOvertime: false,
        displayTime: 55000,
      }
      mockPause.mockResolvedValue(mockData)

      const { result } = renderHook(() => useTimer())

      await act(async () => {
        await result.current.pause()
      })

      expect(mockPause).toHaveBeenCalled()
      expect(result.current.state).toBe('paused')
    })
  })

  describe('resume()', () => {
    it('應呼叫 API 並更新狀態', async () => {
      const mockData: TimerData = {
        state: 'running',
        mode: 'countdown',
        duration: 60000,
        remaining: 55000,
        elapsed: 5000,
        isOvertime: false,
        displayTime: 55000,
      }
      mockResume.mockResolvedValue(mockData)

      const { result } = renderHook(() => useTimer())

      await act(async () => {
        await result.current.resume()
      })

      expect(mockResume).toHaveBeenCalled()
      expect(result.current.state).toBe('running')
    })
  })

  describe('stop()', () => {
    it('應呼叫 API 並更新狀態', async () => {
      const mockData: TimerData = {
        state: 'idle',
        mode: 'countdown',
        duration: 60000,
        remaining: 60000,
        elapsed: 0,
        isOvertime: false,
        displayTime: 60000,
      }
      mockStop.mockResolvedValue(mockData)

      const { result } = renderHook(() => useTimer())

      await act(async () => {
        await result.current.stop()
      })

      expect(mockStop).toHaveBeenCalled()
      expect(result.current.state).toBe('idle')
    })
  })

  describe('reset()', () => {
    it('應呼叫 API 並更新狀態', async () => {
      const mockData: TimerData = {
        state: 'idle',
        mode: 'countdown',
        duration: 60000,
        remaining: 60000,
        elapsed: 0,
        isOvertime: false,
        displayTime: 60000,
      }
      mockReset.mockResolvedValue(mockData)

      const { result } = renderHook(() => useTimer())

      await act(async () => {
        await result.current.reset()
      })

      expect(mockReset).toHaveBeenCalled()
      expect(result.current.state).toBe('idle')
    })
  })

  describe('IPC 事件訂閱', () => {
    it('應訂閱 tick 事件', () => {
      renderHook(() => useTimer())

      expect(mockOnTick).toHaveBeenCalledWith(expect.any(Function))
    })

    it('應訂閱 stateChange 事件', () => {
      renderHook(() => useTimer())

      expect(mockOnStateChange).toHaveBeenCalledWith(expect.any(Function))
    })

    it('應訂閱 complete 事件', () => {
      renderHook(() => useTimer())

      expect(mockOnComplete).toHaveBeenCalledWith(expect.any(Function))
    })

    it('tick 事件應更新狀態', async () => {
      let tickCallback: ((data: TimerData) => void) | null = null
      mockOnTick.mockImplementation((callback: (data: TimerData) => void) => {
        tickCallback = callback
        return vi.fn()
      })

      const { result } = renderHook(() => useTimer())

      const tickData: TimerData = {
        state: 'running',
        mode: 'countdown',
        duration: 60000,
        remaining: 55000,
        elapsed: 5000,
        isOvertime: false,
        displayTime: 55000,
      }

      await act(async () => {
        tickCallback?.(tickData)
      })

      expect(result.current.remaining).toBe(55000)
      expect(result.current.elapsed).toBe(5000)
      expect(result.current.displayTime).toBe(55000)
    })

    it('unmount 時應清除訂閱', () => {
      const cleanupTick = vi.fn()
      const cleanupStateChange = vi.fn()
      const cleanupComplete = vi.fn()

      mockOnTick.mockReturnValue(cleanupTick)
      mockOnStateChange.mockReturnValue(cleanupStateChange)
      mockOnComplete.mockReturnValue(cleanupComplete)

      const { unmount } = renderHook(() => useTimer())

      unmount()

      expect(cleanupTick).toHaveBeenCalled()
      expect(cleanupStateChange).toHaveBeenCalled()
      expect(cleanupComplete).toHaveBeenCalled()
    })

    it('stateChange 事件 callback 應被觸發', async () => {
      let stateChangeCallback: ((data: { previousState: TimerState; currentState: TimerState }) => void) | null = null
      mockOnStateChange.mockImplementation((callback: (data: { previousState: TimerState; currentState: TimerState }) => void) => {
        stateChangeCallback = callback
        return vi.fn()
      })

      renderHook(() => useTimer())

      const stateChangeData = { previousState: 'idle' as TimerState, currentState: 'running' as TimerState }

      // 觸發 callback，不應拋出錯誤
      await act(async () => {
        expect(() => stateChangeCallback?.(stateChangeData)).not.toThrow()
      })
    })

    it('complete 事件 callback 應被觸發', async () => {
      let completeCallback: ((data: { duration: number; actualElapsed: number; mode: TimerMode }) => void) | null = null
      mockOnComplete.mockImplementation((callback: (data: { duration: number; actualElapsed: number; mode: TimerMode }) => void) => {
        completeCallback = callback
        return vi.fn()
      })

      renderHook(() => useTimer())

      const completeData = { duration: 60000, actualElapsed: 60500, mode: 'countdown' as TimerMode }

      // 觸發 callback，不應拋出錯誤
      await act(async () => {
        expect(() => completeCallback?.(completeData)).not.toThrow()
      })
    })
  })

  describe('無 Electron API 時', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'electronAPI', {
        value: undefined,
        writable: true,
        configurable: true,
      })
    })

    it('控制方法不應拋出錯誤', async () => {
      const { result } = renderHook(() => useTimer())

      await act(async () => {
        await expect(result.current.start(60000)).resolves.not.toThrow()
        await expect(result.current.pause()).resolves.not.toThrow()
        await expect(result.current.resume()).resolves.not.toThrow()
        await expect(result.current.stop()).resolves.not.toThrow()
        await expect(result.current.reset()).resolves.not.toThrow()
      })
    })

    it('應維持預設狀態', () => {
      const { result } = renderHook(() => useTimer())

      expect(result.current.state).toBe('idle')
      expect(result.current.duration).toBe(0)
    })
  })

  describe('overtime 狀態', () => {
    it('tick 事件應正確顯示 overtime 狀態', async () => {
      let tickCallback: ((data: TimerData) => void) | null = null
      mockOnTick.mockImplementation((callback: (data: TimerData) => void) => {
        tickCallback = callback
        return vi.fn()
      })

      const { result } = renderHook(() => useTimer())

      const overtimeData: TimerData = {
        state: 'overtime',
        mode: 'countdown',
        duration: 60000,
        remaining: -5000,
        elapsed: 65000,
        isOvertime: true,
        displayTime: -5000,
      }

      await act(async () => {
        tickCallback?.(overtimeData)
      })

      expect(result.current.state).toBe('overtime')
      expect(result.current.isOvertime).toBe(true)
      expect(result.current.remaining).toBe(-5000)
    })
  })
})
