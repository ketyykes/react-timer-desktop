import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'
import type { TaskRecord, TimerData } from '../../../shared/types'

// Mock Electron API
const mockStart = vi.fn()
const mockPause = vi.fn()
const mockResume = vi.fn()
const mockStop = vi.fn()
const mockReset = vi.fn()
const mockOnTick = vi.fn()
const mockOnStateChange = vi.fn()
const mockOnComplete = vi.fn()

const mockTaskSave = vi.fn()
const mockTaskGetAll = vi.fn()
const mockTaskDelete = vi.fn()

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

const mockTaskAPI = {
  save: mockTaskSave,
  getAll: mockTaskGetAll,
  delete: mockTaskDelete,
}

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockOnTick.mockReturnValue(vi.fn())
    mockOnStateChange.mockReturnValue(vi.fn())
    mockOnComplete.mockReturnValue(vi.fn())
    mockTaskGetAll.mockResolvedValue([])

    Object.defineProperty(window, 'electronAPI', {
      value: {
        timer: mockTimerAPI,
        task: mockTaskAPI,
      },
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

  describe('Tab 切換', () => {
    it('應顯示計時器和歷史記錄兩個 Tab', () => {
      render(<App />)
      expect(screen.getByRole('tab', { name: '計時器' })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: '歷史記錄' })).toBeInTheDocument()
    })

    it('預設顯示計時器 Tab', () => {
      render(<App />)
      expect(screen.getByRole('tab', { name: '計時器' })).toHaveAttribute('aria-selected', 'true')
    })

    it('點擊歷史記錄 Tab 應切換內容', async () => {
      render(<App />)
      const historyTab = screen.getByRole('tab', { name: '歷史記錄' })
      await userEvent.click(historyTab)
      expect(screen.getByText('任務歷史')).toBeInTheDocument()
    })

    it('切換到歷史記錄 Tab 應載入任務清單', async () => {
      const mockTasks: TaskRecord[] = [
        {
          id: '1',
          name: '測試任務',
          duration: 300000,
          actualTime: 310000,
          createdAt: Date.now(),
        },
      ]
      mockTaskGetAll.mockResolvedValue(mockTasks)

      render(<App />)
      const historyTab = screen.getByRole('tab', { name: '歷史記錄' })
      await userEvent.click(historyTab)

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0))
      })

      expect(mockTaskGetAll).toHaveBeenCalled()
      expect(screen.getByText('測試任務')).toBeInTheDocument()
    })
  })

  describe('Timer 整合', () => {
    it('應在計時器 Tab 中顯示 Timer 元件', () => {
      render(<App />)
      expect(screen.getByTestId('timer-display')).toBeInTheDocument()
    })

    it('任務描述輸入應正確連接', async () => {
      render(<App />)
      const input = screen.getByPlaceholderText('這次要做什麼？（選填）')
      await userEvent.type(input, '我的任務')
      expect(input).toHaveValue('我的任務')
    })
  })

  describe('TaskDialog 整合', () => {
    it('點擊停止按鈕時應顯示 TaskDialog', async () => {
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

      render(<App />)

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

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0))
      })

      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('記錄任務')).toBeInTheDocument()
    })

    it('儲存任務後應關閉對話框', async () => {
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
      mockTaskSave.mockResolvedValue(undefined)

      render(<App />)

      // 模擬運行中狀態
      await act(async () => {
        tickCallback?.({
          state: 'running',
          mode: 'countdown',
          duration: 300000,
          remaining: 295000,
          elapsed: 5000,
          isOvertime: false,
          displayTime: 295000,
        })
      })

      // 點擊停止按鈕
      await userEvent.click(screen.getByRole('button', { name: /停止/i }))

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0))
      })

      // 點擊儲存
      const saveButton = screen.getByRole('button', { name: '儲存' })
      await userEvent.click(saveButton)

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0))
      })

      expect(mockTaskSave).toHaveBeenCalled()
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('跳過時應關閉對話框但不儲存', async () => {
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

      render(<App />)

      // 模擬運行中狀態
      await act(async () => {
        tickCallback?.({
          state: 'running',
          mode: 'countdown',
          duration: 300000,
          remaining: 295000,
          elapsed: 5000,
          isOvertime: false,
          displayTime: 295000,
        })
      })

      // 點擊停止按鈕
      await userEvent.click(screen.getByRole('button', { name: /停止/i }))

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0))
      })

      // 點擊跳過
      const skipButton = screen.getByRole('button', { name: '跳過' })
      await userEvent.click(skipButton)

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0))
      })

      expect(mockTaskSave).not.toHaveBeenCalled()
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('對話框應預填任務描述', async () => {
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

      render(<App />)

      // 先輸入任務描述
      const descInput = screen.getByPlaceholderText('這次要做什麼？（選填）')
      await userEvent.type(descInput, '我的測試任務')

      // 模擬運行中狀態
      await act(async () => {
        tickCallback?.({
          state: 'running',
          mode: 'countdown',
          duration: 300000,
          remaining: 295000,
          elapsed: 5000,
          isOvertime: false,
          displayTime: 295000,
        })
      })

      // 點擊停止按鈕
      await userEvent.click(screen.getByRole('button', { name: /停止/i }))

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0))
      })

      // 對話框應有預填值
      const dialogInput = screen.getByPlaceholderText('輸入任務名稱（選填）')
      expect(dialogInput).toHaveValue('我的測試任務')
    })
  })

  describe('TaskHistory 整合', () => {
    it('刪除任務後應重新載入清單', async () => {
      const mockTasks: TaskRecord[] = [
        {
          id: '1',
          name: '待刪除任務',
          duration: 300000,
          actualTime: 310000,
          createdAt: Date.now(),
        },
      ]
      mockTaskGetAll.mockResolvedValue(mockTasks)
      mockTaskDelete.mockResolvedValue(undefined)

      render(<App />)

      // 切換到歷史記錄
      const historyTab = screen.getByRole('tab', { name: '歷史記錄' })
      await userEvent.click(historyTab)

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0))
      })

      // 點擊刪除
      const deleteButton = screen.getByRole('button', { name: '刪除' })

      // 刪除後清空清單
      mockTaskGetAll.mockResolvedValue([])
      await userEvent.click(deleteButton)

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0))
      })

      expect(mockTaskDelete).toHaveBeenCalledWith('1')
      expect(mockTaskGetAll).toHaveBeenCalledTimes(2)
    })
  })
})
