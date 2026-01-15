import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { TimerService, TimerEventCallbacks } from '../TimerService'

describe('TimerService', () => {
  let timerService: TimerService
  let mockCallbacks: TimerEventCallbacks

  beforeEach(() => {
    vi.useFakeTimers()
    timerService = new TimerService()
    mockCallbacks = {
      onTick: vi.fn(),
      onStateChange: vi.fn(),
      onComplete: vi.fn(),
    }
    timerService.setCallbacks(mockCallbacks)
  })

  afterEach(() => {
    timerService.destroy()
    vi.useRealTimers()
  })

  describe('initial state', () => {
    it('應初始化為 idle 狀態', () => {
      const data = timerService.getData()
      expect(data.state).toBe('idle')
      expect(data.duration).toBe(0)
      expect(data.remaining).toBe(0)
      expect(data.elapsed).toBe(0)
      expect(data.isOvertime).toBe(false)
    })

    it('getFormattedTime 應回傳 00:00', () => {
      expect(timerService.getFormattedTime()).toBe('00:00')
    })
  })

  describe('start()', () => {
    it('應開始計時並發送 tick', () => {
      timerService.start(60000)

      expect(timerService.getData().state).toBe('running')
      expect(timerService.getData().duration).toBe(60000)
      expect(mockCallbacks.onStateChange).toHaveBeenCalledWith('idle', 'running')
      expect(mockCallbacks.onTick).toHaveBeenCalled()
    })

    it('duration <= 0 應拋出錯誤', () => {
      expect(() => timerService.start(0)).toThrow('Duration must be a positive number')
      expect(() => timerService.start(-1000)).toThrow('Duration must be a positive number')
    })

    it('應正確更新剩餘時間', () => {
      timerService.start(60000)

      // 前進 1 秒
      vi.advanceTimersByTime(1000)

      const data = timerService.getData()
      expect(data.elapsed).toBeGreaterThan(0)
      expect(data.remaining).toBeLessThan(60000)
    })

    it('再次 start 應重置計時器', () => {
      timerService.start(60000)
      vi.advanceTimersByTime(5000)

      timerService.start(30000)

      const data = timerService.getData()
      expect(data.duration).toBe(30000)
      expect(data.elapsed).toBe(0)
    })
  })

  describe('pause()', () => {
    it('running 狀態應能暫停', () => {
      timerService.start(60000)
      vi.advanceTimersByTime(5000)

      timerService.pause()

      expect(timerService.getData().state).toBe('paused')
      expect(mockCallbacks.onStateChange).toHaveBeenCalledWith('running', 'paused')
    })

    it('idle 狀態不應有效果', () => {
      timerService.pause()

      expect(timerService.getData().state).toBe('idle')
      expect(mockCallbacks.onStateChange).not.toHaveBeenCalled()
    })

    it('暫停後時間不應繼續', () => {
      timerService.start(60000)
      vi.advanceTimersByTime(5000)
      timerService.pause()

      const elapsedAtPause = timerService.getData().elapsed

      vi.advanceTimersByTime(5000)

      expect(timerService.getData().elapsed).toBe(elapsedAtPause)
    })

    it('overtime 狀態也應能暫停', () => {
      timerService.start(1000)
      vi.advanceTimersByTime(2000)

      expect(timerService.getData().state).toBe('overtime')

      timerService.pause()

      expect(timerService.getData().state).toBe('paused')
      expect(mockCallbacks.onStateChange).toHaveBeenCalledWith('overtime', 'paused')
    })
  })

  describe('resume()', () => {
    it('paused 狀態應能繼續', () => {
      timerService.start(60000)
      vi.advanceTimersByTime(5000)
      timerService.pause()

      timerService.resume()

      expect(timerService.getData().state).toBe('running')
      expect(mockCallbacks.onStateChange).toHaveBeenCalledWith('paused', 'running')
    })

    it('非 paused 狀態不應有效果', () => {
      timerService.start(60000)

      vi.mocked(mockCallbacks.onStateChange!).mockClear()
      timerService.resume()

      expect(mockCallbacks.onStateChange).not.toHaveBeenCalled()
    })

    it('resume 後應從暫停點繼續', () => {
      timerService.start(60000)
      vi.advanceTimersByTime(10000)
      timerService.pause()

      const elapsedAtPause = timerService.getData().elapsed

      timerService.resume()
      vi.advanceTimersByTime(5000)

      expect(timerService.getData().elapsed).toBeGreaterThan(elapsedAtPause)
    })

    it('overtime 後暫停再繼續應恢復 overtime 狀態', () => {
      timerService.start(1000)
      vi.advanceTimersByTime(2000)
      timerService.pause()

      timerService.resume()

      expect(timerService.getData().state).toBe('overtime')
      expect(mockCallbacks.onStateChange).toHaveBeenCalledWith('paused', 'overtime')
    })
  })

  describe('stop()', () => {
    it('應停止計時並重置狀態', () => {
      timerService.start(60000)
      vi.advanceTimersByTime(5000)

      timerService.stop()

      expect(timerService.getData().state).toBe('idle')
      expect(mockCallbacks.onStateChange).toHaveBeenCalledWith('running', 'idle')
    })

    it('idle 狀態不應有效果', () => {
      timerService.stop()

      expect(timerService.getData().state).toBe('idle')
      expect(mockCallbacks.onStateChange).not.toHaveBeenCalled()
    })

    it('paused 狀態也能停止', () => {
      timerService.start(60000)
      timerService.pause()

      timerService.stop()

      expect(timerService.getData().state).toBe('idle')
      expect(mockCallbacks.onStateChange).toHaveBeenCalledWith('paused', 'idle')
    })
  })

  describe('reset()', () => {
    it('應重置計時器但保留 duration', () => {
      timerService.start(60000)
      vi.advanceTimersByTime(5000)

      timerService.reset()

      const data = timerService.getData()
      expect(data.state).toBe('idle')
      expect(data.elapsed).toBe(0)
      expect(data.remaining).toBe(60000)
    })

    it('idle 狀態 reset 不應觸發 stateChange', () => {
      timerService.reset()

      expect(mockCallbacks.onStateChange).not.toHaveBeenCalled()
    })
  })

  describe('overtime mode', () => {
    it('時間到達應切換到 overtime', () => {
      timerService.start(2000)
      vi.advanceTimersByTime(3000)

      expect(timerService.getData().state).toBe('overtime')
      expect(timerService.getData().isOvertime).toBe(true)
      expect(mockCallbacks.onStateChange).toHaveBeenCalledWith('running', 'overtime')
    })

    it('overtime 時應觸發 onComplete（只一次）', () => {
      timerService.start(1000)
      vi.advanceTimersByTime(2000)

      expect(mockCallbacks.onComplete).toHaveBeenCalledTimes(1)
      expect(mockCallbacks.onComplete).toHaveBeenCalledWith(1000, expect.any(Number))

      // 再過幾秒不應再次觸發
      vi.advanceTimersByTime(5000)
      expect(mockCallbacks.onComplete).toHaveBeenCalledTimes(1)
    })

    it('overtime 模式應繼續計時', () => {
      timerService.start(1000)
      vi.advanceTimersByTime(3000)

      const data = timerService.getData()
      expect(data.remaining).toBeLessThan(0)
      expect(data.elapsed).toBeGreaterThan(1000)
    })

    it('getFormattedTime 在 overtime 時應顯示負數', () => {
      timerService.start(1000)
      vi.advanceTimersByTime(62000) // 超過 1 分鐘

      expect(timerService.getFormattedTime()).toMatch(/^-\d{2}:\d{2}$/)
    })
  })

  describe('tick events', () => {
    it('應每秒發送 tick', () => {
      timerService.start(10000)

      // 初始 tick
      expect(mockCallbacks.onTick).toHaveBeenCalledTimes(1)

      vi.advanceTimersByTime(1000)
      expect(mockCallbacks.onTick).toHaveBeenCalledTimes(2)

      vi.advanceTimersByTime(1000)
      expect(mockCallbacks.onTick).toHaveBeenCalledTimes(3)
    })

    it('暫停後不應發送 tick', () => {
      timerService.start(10000)
      timerService.pause()

      vi.mocked(mockCallbacks.onTick!).mockClear()
      vi.advanceTimersByTime(3000)

      expect(mockCallbacks.onTick).not.toHaveBeenCalled()
    })
  })

  describe('destroy()', () => {
    it('應停止 interval 並清除 callbacks', () => {
      timerService.start(60000)
      timerService.destroy()

      vi.mocked(mockCallbacks.onTick!).mockClear()
      vi.advanceTimersByTime(5000)

      expect(mockCallbacks.onTick).not.toHaveBeenCalled()
    })
  })

  describe('setCallbacks()', () => {
    it('應能合併新的 callbacks（不覆蓋舊的）', () => {
      const newCallbacks: TimerEventCallbacks = {
        onTick: vi.fn(),
      }

      timerService.setCallbacks(newCallbacks)
      timerService.start(60000)

      // 新的 callback 應被呼叫
      expect(newCallbacks.onTick).toHaveBeenCalled()
      // 舊的 callback 也應被呼叫（合併模式）
      expect(mockCallbacks.onTick).toHaveBeenCalled()
    })
  })

  describe('edge cases', () => {
    it('多次 pause 不應重複觸發 stateChange', () => {
      timerService.start(60000)
      timerService.pause()

      vi.mocked(mockCallbacks.onStateChange!).mockClear()
      timerService.pause()

      expect(mockCallbacks.onStateChange).not.toHaveBeenCalled()
    })

    it('多次 resume 不應重複觸發 stateChange', () => {
      timerService.start(60000)
      timerService.pause()
      timerService.resume()

      vi.mocked(mockCallbacks.onStateChange!).mockClear()
      timerService.resume()

      expect(mockCallbacks.onStateChange).not.toHaveBeenCalled()
    })

    it('stop 後再 start 應重新開始', () => {
      timerService.start(60000)
      vi.advanceTimersByTime(10000)
      timerService.stop()

      timerService.start(30000)

      expect(timerService.getData().state).toBe('running')
      expect(timerService.getData().duration).toBe(30000)
      expect(timerService.getData().elapsed).toBe(0)
    })
  })
})
