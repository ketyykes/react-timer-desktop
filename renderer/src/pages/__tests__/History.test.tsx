import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { TaskRecord } from '../../../../shared/types'

const mockGetAll = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()

describe('History', () => {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const mockTasks: TaskRecord[] = [
    {
      id: '1',
      name: '今天任務',
      duration: 300000,
      actualTime: 300000,
      createdAt: today.getTime(),
    },
    {
      id: '2',
      name: '昨天任務',
      duration: 600000,
      actualTime: 600000,
      createdAt: yesterday.getTime(),
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetAll.mockResolvedValue(mockTasks)

    Object.defineProperty(window, 'electronAPI', {
      value: {
        task: {
          getAll: mockGetAll,
          update: mockUpdate,
          delete: mockDelete,
        },
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

  it('應該載入並顯示歷史記錄標題', async () => {
    const { History } = await import('../History')
    render(<History />)

    expect(screen.getByText('歷史記錄')).toBeInTheDocument()
  })

  it('應該按日期分組顯示任務', async () => {
    const { History } = await import('../History')
    render(<History />)

    await waitFor(() => {
      // 使用更精確的匹配，日期標題格式為 "今天 (1)"
      expect(screen.getByText(/今天 \(1\)/)).toBeInTheDocument()
      expect(screen.getByText(/昨天 \(1\)/)).toBeInTheDocument()
    })
  })

  it('預設展開今天的任務', async () => {
    const { History } = await import('../History')
    render(<History />)

    await waitFor(() => {
      expect(screen.getByText('今天任務')).toBeVisible()
    })
  })

  it('點擊日期標題應該展開/收合', async () => {
    const user = userEvent.setup()
    const { History } = await import('../History')
    render(<History />)

    await waitFor(() => {
      expect(mockGetAll).toHaveBeenCalled()
    })

    // 昨天預設收合，點擊展開
    const yesterdayHeader = screen.getByText(/昨天/)
    await user.click(yesterdayHeader)

    await waitFor(() => {
      expect(screen.getByText('昨天任務')).toBeVisible()
    })
  })

  it('應該顯示任務時間', async () => {
    const { History } = await import('../History')
    render(<History />)

    await waitFor(() => {
      // 300000ms = 5分鐘 = 05:00
      expect(screen.getByText('05:00')).toBeInTheDocument()
    })
  })

  it('點擊編輯按鈕應該進入編輯模式', async () => {
    const user = userEvent.setup()
    const { History } = await import('../History')
    render(<History />)

    await waitFor(() => {
      expect(screen.getByText('今天任務')).toBeInTheDocument()
    })

    // 找到編輯按鈕並點擊
    const editButton = screen.getByLabelText('編輯 今天任務')
    await user.click(editButton)

    // 應該顯示編輯輸入框
    const input = screen.getByDisplayValue('今天任務')
    expect(input).toBeInTheDocument()
  })

  it('點擊刪除按鈕應該顯示確認刪除', async () => {
    const user = userEvent.setup()
    const { History } = await import('../History')
    render(<History />)

    await waitFor(() => {
      expect(screen.getByText('今天任務')).toBeInTheDocument()
    })

    // 找到刪除按鈕並點擊
    const deleteButton = screen.getByLabelText('刪除 今天任務')
    await user.click(deleteButton)

    // 應該顯示確認刪除按鈕
    expect(screen.getByText('確認刪除')).toBeInTheDocument()
  })

  it('確認刪除應該呼叫 delete API', async () => {
    const user = userEvent.setup()
    mockDelete.mockResolvedValue(undefined)
    mockGetAll.mockResolvedValueOnce(mockTasks).mockResolvedValueOnce([mockTasks[1]])

    const { History } = await import('../History')
    render(<History />)

    await waitFor(() => {
      expect(screen.getByText('今天任務')).toBeInTheDocument()
    })

    // 點擊刪除按鈕
    const deleteButton = screen.getByLabelText('刪除 今天任務')
    await user.click(deleteButton)

    // 點擊確認刪除
    await user.click(screen.getByText('確認刪除'))

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith('1')
    })
  })

  it('沒有任務時應該顯示空狀態', async () => {
    mockGetAll.mockResolvedValue([])

    const { History } = await import('../History')
    render(<History />)

    await waitFor(() => {
      expect(screen.getByText('沒有歷史記錄')).toBeInTheDocument()
    })
  })
})
