import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Timer, type TimerProps } from '../Timer'
import type { TimerData, TimerMode } from '../../../../../shared/types'

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

// 預設 props
const defaultProps: TimerProps = {
  taskDescription: '',
  onTaskDescriptionChange: vi.fn(),
  onStop: vi.fn(),
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
      render(<Timer {...defaultProps} />)
      expect(screen.getByTestId('timer-display')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('輸入時間 (例: 5:00)')).toBeInTheDocument()
    })

    it('idle 狀態應顯示預設時間按鈕', () => {
      render(<Timer {...defaultProps} />)
      expect(screen.getByRole('button', { name: '5 分鐘' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '10 分鐘' })).toBeInTheDocument()
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

      render(<Timer {...defaultProps} />)

      const input = screen.getByPlaceholderText('輸入時間 (例: 5:00)')
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

      render(<Timer {...defaultProps} />)

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

      render(<Timer {...defaultProps} />)

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

      render(<Timer {...defaultProps} />)

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

  describe('任務描述功能', () => {
    it('應顯示任務描述輸入框', () => {
      render(<Timer {...defaultProps} />)
      expect(screen.getByPlaceholderText('這次要做什麼？（選填）')).toBeInTheDocument()
    })

    it('計時中不應顯示任務描述輸入框', async () => {
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

      render(<Timer {...defaultProps} />)
      const presetButton = screen.getByText('5 分鐘')
      await userEvent.click(presetButton)
      expect(screen.queryByPlaceholderText('這次要做什麼？（選填）')).not.toBeInTheDocument()
    })

    it('應使用 props.taskDescription 作為初始值', () => {
      render(<Timer {...defaultProps} taskDescription="測試任務" />)
      const input = screen.getByPlaceholderText('這次要做什麼？（選填）')
      expect(input).toHaveValue('測試任務')
    })

    it('輸入變更時應呼叫 onTaskDescriptionChange', async () => {
      const onTaskDescriptionChange = vi.fn()
      render(<Timer {...defaultProps} onTaskDescriptionChange={onTaskDescriptionChange} />)

      const input = screen.getByPlaceholderText('這次要做什麼？（選填）')
      await userEvent.type(input, '新任務')

      expect(onTaskDescriptionChange).toHaveBeenCalled()
    })
  })

  describe('停止回調功能', () => {
    it('點擊停止按鈕時應呼叫 onStop', async () => {
      const onStop = vi.fn()
      let tickCallback: ((data: TimerData) => void) | null = null

      mockOnTick.mockImplementation((callback: (data: TimerData) => void) => {
        tickCallback = callback
        return vi.fn()
      })

      const mockStopData: TimerData = {
        state: 'idle',
        mode: 'countdown',
        duration: 0,
        remaining: 0,
        elapsed: 0,
        isOvertime: false,
        displayTime: 0,
      }
      mockStop.mockResolvedValue(mockStopData)

      render(<Timer {...defaultProps} onStop={onStop} />)

      // 模擬運行中狀態
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

      // 點擊停止按鈕
      const stopButton = screen.getByRole('button', { name: /停止/i })
      await userEvent.click(stopButton)

      expect(mockStop).toHaveBeenCalled()
      expect(onStop).toHaveBeenCalledWith({
        duration: 300000,
        actualElapsed: 5000,
        mode: 'countdown',
      })
    })
  })
})
