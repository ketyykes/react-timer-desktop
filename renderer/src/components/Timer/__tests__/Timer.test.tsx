import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { Timer } from '../Timer'
import type { TimerData } from '../../../../../shared/types'

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

describe('Timer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockOnTick.mockReturnValue(vi.fn())
    mockOnStateChange.mockReturnValue(vi.fn())
    mockOnComplete.mockReturnValue(vi.fn())

    Object.defineProperty(window, 'electronAPI', {
      value: { timer: mockTimerAPI },
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    Object.defineProperty(window, 'electronAPI', {
      value: undefined,
      writable: true,
      configurable: true,
    })
  })

  describe('整合測試', () => {
    it('應顯示計時器介面', () => {
      render(<Timer />)
      expect(screen.getByTestId('timer-display')).toBeInTheDocument()
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('idle 狀態應顯示預設時間按鈕', () => {
      render(<Timer />)
      expect(screen.getByRole('button', { name: '5 分鐘' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '15 分鐘' })).toBeInTheDocument()
    })

    it('輸入時間並按開始應呼叫 start', async () => {
      const mockData: TimerData = {
        state: 'running',
        mode: 'countdown',
        duration: 300000,
        remaining: 300000,
        elapsed: 0,
        isOvertime: false,
        displayTime: 300000,
      }
      mockStart.mockResolvedValue(mockData)

      render(<Timer />)

      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: '05:00' } })
      fireEvent.keyDown(input, { key: 'Enter' })

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0))
      })

      expect(mockStart).toHaveBeenCalledWith(300000, 'countdown')
    })

    it('點擊預設時間按鈕應呼叫 start', async () => {
      const mockData: TimerData = {
        state: 'running',
        mode: 'countdown',
        duration: 300000,
        remaining: 300000,
        elapsed: 0,
        isOvertime: false,
        displayTime: 300000,
      }
      mockStart.mockResolvedValue(mockData)

      render(<Timer />)

      fireEvent.click(screen.getByRole('button', { name: '5 分鐘' }))

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0))
      })

      expect(mockStart).toHaveBeenCalledWith(300000, 'countdown')
    })

    it('running 狀態 UI 應正確更新', async () => {
      let tickCallback: ((data: TimerData) => void) | null = null
      mockOnTick.mockImplementation((callback: (data: TimerData) => void) => {
        tickCallback = callback
        return vi.fn()
      })

      render(<Timer />)

      const runningData: TimerData = {
        state: 'running',
        mode: 'countdown',
        duration: 300000,
        remaining: 295000,
        elapsed: 5000,
        isOvertime: false,
        displayTime: 295000,
      }

      await act(async () => {
        tickCallback?.(runningData)
      })

      expect(screen.getByText('04:55')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /暫停/i })).toBeInTheDocument()
    })

    it('overtime 狀態應顯示紅色時間', async () => {
      let tickCallback: ((data: TimerData) => void) | null = null
      mockOnTick.mockImplementation((callback: (data: TimerData) => void) => {
        tickCallback = callback
        return vi.fn()
      })

      render(<Timer />)

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

      expect(screen.getByText('-00:05')).toBeInTheDocument()
      const display = screen.getByTestId('timer-display')
      expect(display).toHaveClass('text-red-500')
    })
  })
})
