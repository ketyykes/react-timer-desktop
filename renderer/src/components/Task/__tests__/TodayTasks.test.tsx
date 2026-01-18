import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TodayTasks } from '../TodayTasks'
import type { TaskRecord } from '../../../../../shared/types'

const mockTasks: TaskRecord[] = [
  { id: '1', name: '任務一', duration: 300000, actualTime: 300000, createdAt: Date.now() },
  { id: '2', name: '任務二', duration: 600000, actualTime: 550000, createdAt: Date.now() - 1000 },
  { id: '3', name: '任務三', duration: 900000, actualTime: 900000, createdAt: Date.now() - 2000 },
  { id: '4', name: '任務四', duration: 1200000, actualTime: 1200000, createdAt: Date.now() - 3000 },
]

describe('TodayTasks', () => {
  const defaultProps = {
    tasks: mockTasks,
    onUpdate: vi.fn(),
    onDelete: vi.fn(),
    onViewAll: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('最多顯示 3 筆任務', () => {
    render(<TodayTasks {...defaultProps} />)
    const items = screen.getAllByTestId('today-task-item')
    expect(items).toHaveLength(3)
  })

  it('無任務時顯示空狀態', () => {
    render(<TodayTasks {...defaultProps} tasks={[]} />)
    expect(screen.getByText('今天還沒有完成任務')).toBeInTheDocument()
  })

  it('點擊任務名稱應進入編輯模式', async () => {
    const user = userEvent.setup()
    render(<TodayTasks {...defaultProps} />)

    await user.click(screen.getByText('任務一'))
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('編輯後按 Enter 應呼叫 onUpdate', async () => {
    const user = userEvent.setup()
    const onUpdate = vi.fn()
    render(<TodayTasks {...defaultProps} onUpdate={onUpdate} />)

    await user.click(screen.getByText('任務一'))
    const input = screen.getByRole('textbox')
    await user.clear(input)
    await user.type(input, '新名稱{Enter}')

    expect(onUpdate).toHaveBeenCalledWith('1', '新名稱')
  })

  it('點擊刪除應顯示確認按鈕', async () => {
    const user = userEvent.setup()
    render(<TodayTasks {...defaultProps} />)

    const deleteButtons = screen.getAllByLabelText('刪除')
    await user.click(deleteButtons[0])

    expect(screen.getByText('確認刪除')).toBeInTheDocument()
    expect(screen.getByText('取消')).toBeInTheDocument()
  })

  it('確認刪除應呼叫 onDelete', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    render(<TodayTasks {...defaultProps} onDelete={onDelete} />)

    const deleteButtons = screen.getAllByLabelText('刪除')
    await user.click(deleteButtons[0])
    await user.click(screen.getByText('確認刪除'))

    expect(onDelete).toHaveBeenCalledWith('1')
  })

  it('點擊取消應恢復正常顯示', async () => {
    const user = userEvent.setup()
    render(<TodayTasks {...defaultProps} />)

    const deleteButtons = screen.getAllByLabelText('刪除')
    await user.click(deleteButtons[0])
    await user.click(screen.getByText('取消'))

    expect(screen.queryByText('確認刪除')).not.toBeInTheDocument()
  })

  it('點擊查看全部應呼叫 onViewAll', async () => {
    const user = userEvent.setup()
    const onViewAll = vi.fn()
    render(<TodayTasks {...defaultProps} onViewAll={onViewAll} />)

    await user.click(screen.getByText('查看全部'))
    expect(onViewAll).toHaveBeenCalled()
  })
})
