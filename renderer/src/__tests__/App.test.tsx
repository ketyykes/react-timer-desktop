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
const mockTaskUpdate = vi.fn()

const mockHistoryOpen = vi.fn()

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
  update: mockTaskUpdate,
}

const mockHistoryAPI = {
  open: mockHistoryOpen,
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
        history: mockHistoryAPI,
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

  describe('單頁整合佈局', () => {
    it('應該同時顯示計時器和今日記錄', async () => {
      render(<App />)

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0))
      })

      expect(screen.getByTestId('timer-display')).toBeInTheDocument()
      expect(screen.getByText('今日')).toBeInTheDocument()
    })

    it('不應該有 Tabs', () => {
      render(<App />)

      expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
    })

    it('點擊查看全部應呼叫 history.open', async () => {
      const user = userEvent.setup()
      render(<App />)

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0))
      })

      await user.click(screen.getByText('查看全部'))

      expect(mockHistoryOpen).toHaveBeenCalled()
    })

    it('應該載入並顯示今日任務', async () => {
      const today = new Date()
      const mockTasks: TaskRecord[] = [
        {
          id: '1',
          name: '今日任務',
          duration: 300000,
          actualTime: 310000,
          createdAt: today.getTime(),
        },
      ]
      mockTaskGetAll.mockResolvedValue(mockTasks)

      render(<App />)

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0))
      })

      expect(mockTaskGetAll).toHaveBeenCalled()
      expect(screen.getByText('今日任務')).toBeInTheDocument()
    })

    it('不應該顯示非今日的任務', async () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const mockTasks: TaskRecord[] = [
        {
          id: '1',
          name: '昨日任務',
          duration: 300000,
          actualTime: 310000,
          createdAt: yesterday.getTime(),
        },
      ]
      mockTaskGetAll.mockResolvedValue(mockTasks)

      render(<App />)

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0))
      })

      expect(screen.queryByText('昨日任務')).not.toBeInTheDocument()
      expect(screen.getByText('今天還沒有完成任務')).toBeInTheDocument()
    })
  })

  describe('Timer 整合', () => {
    it('應顯示 Timer 元件', () => {
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

    it('儲存任務後應關閉對話框並重新載入任務', async () => {
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

      // 清除初始載入的呼叫
      mockTaskGetAll.mockClear()

      // 點擊儲存
      const saveButton = screen.getByRole('button', { name: '儲存' })
      await userEvent.click(saveButton)

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0))
      })

      expect(mockTaskSave).toHaveBeenCalled()
      expect(mockTaskGetAll).toHaveBeenCalled() // 儲存後重新載入
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

  describe('TodayTasks 整合', () => {
    it('刪除任務後應重新載入清單', async () => {
      const today = new Date()
      const mockTasks: TaskRecord[] = [
        {
          id: '1',
          name: '待刪除任務',
          duration: 300000,
          actualTime: 310000,
          createdAt: today.getTime(),
        },
      ]
      mockTaskGetAll.mockResolvedValue(mockTasks)
      mockTaskDelete.mockResolvedValue(undefined)

      render(<App />)

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0))
      })

      // 點擊刪除
      const deleteButton = screen.getByLabelText('刪除')
      await userEvent.click(deleteButton)

      // 確認刪除
      await userEvent.click(screen.getByText('確認刪除'))

      // 刪除後清空清單
      mockTaskGetAll.mockResolvedValue([])

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0))
      })

      expect(mockTaskDelete).toHaveBeenCalledWith('1')
    })

    it('更新任務名稱後應重新載入清單', async () => {
      const today = new Date()
      const mockTasks: TaskRecord[] = [
        {
          id: '1',
          name: '原始名稱',
          duration: 300000,
          actualTime: 310000,
          createdAt: today.getTime(),
        },
      ]
      mockTaskGetAll.mockResolvedValue(mockTasks)
      mockTaskUpdate.mockResolvedValue(undefined)

      render(<App />)

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0))
      })

      // 點擊任務名稱進入編輯模式
      await userEvent.click(screen.getByText('原始名稱'))

      // 修改名稱 - 選擇編輯中的 input（在 today-task-item 內的）
      const taskItem = screen.getByTestId('today-task-item')
      const input = taskItem.querySelector('input') as HTMLInputElement
      await userEvent.clear(input)
      await userEvent.type(input, '新名稱{Enter}')

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0))
      })

      expect(mockTaskUpdate).toHaveBeenCalledWith({ id: '1', name: '新名稱' })
    })
  })
})
