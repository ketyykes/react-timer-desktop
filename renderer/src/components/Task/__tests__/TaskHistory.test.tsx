import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TaskHistory } from '../TaskHistory'
import type { TaskRecord } from '../../../../../shared/types'

describe('TaskHistory', () => {
  const mockTasks: TaskRecord[] = [
    {
      id: '1',
      name: '工作任務',
      duration: 1500000, // 25 分鐘
      actualTime: 1520000, // 25:20
      createdAt: new Date('2026-01-15T10:30:00').getTime(),
    },
    {
      id: '2',
      name: '休息',
      duration: 300000, // 5 分鐘
      actualTime: 300000,
      createdAt: new Date('2026-01-15T09:00:00').getTime(),
    },
    {
      id: '3',
      name: '未命名任務',
      duration: 600000, // 10 分鐘
      actualTime: 650000, // 10:50
      createdAt: new Date('2026-01-14T15:00:00').getTime(),
    },
  ]

  describe('渲染', () => {
    it('無任務時應顯示空狀態', () => {
      render(<TaskHistory tasks={[]} />)
      expect(screen.getByText('尚無任務記錄')).toBeInTheDocument()
    })

    it('應顯示任務清單', () => {
      render(<TaskHistory tasks={mockTasks} />)
      expect(screen.getByText('工作任務')).toBeInTheDocument()
      expect(screen.getByText('休息')).toBeInTheDocument()
      expect(screen.getByText('未命名任務')).toBeInTheDocument()
    })

    it('應顯示任務設定時間', () => {
      render(<TaskHistory tasks={mockTasks} />)
      // 時間與日期組合在同一元素內，用正則匹配
      expect(screen.getByText(/25:00 ·/)).toBeInTheDocument()
      expect(screen.getByText(/05:00 ·/)).toBeInTheDocument()
      expect(screen.getByText(/10:00 ·/)).toBeInTheDocument()
    })

    it('應顯示任務日期', () => {
      render(<TaskHistory tasks={mockTasks} />)
      // 有兩個任務在 2026/01/15，使用 getAllByText
      const jan15Elements = screen.getAllByText(/2026\/01\/15/)
      expect(jan15Elements.length).toBeGreaterThanOrEqual(1)
      expect(screen.getByText(/2026\/01\/14/)).toBeInTheDocument()
    })

    it('應顯示標題', () => {
      render(<TaskHistory tasks={mockTasks} />)
      expect(screen.getByText('任務歷史')).toBeInTheDocument()
    })
  })

  describe('排序', () => {
    it('任務應依時間倒序排列（最新在前）', () => {
      render(<TaskHistory tasks={mockTasks} />)

      const taskElements = screen.getAllByTestId('task-item')
      expect(taskElements).toHaveLength(3)

      // 第一個應是最新的任務
      expect(taskElements[0]).toHaveTextContent('工作任務')
      expect(taskElements[1]).toHaveTextContent('休息')
      expect(taskElements[2]).toHaveTextContent('未命名任務')
    })
  })

  describe('刪除功能', () => {
    it('應有刪除按鈕', () => {
      render(<TaskHistory tasks={mockTasks} onDelete={vi.fn()} />)
      const deleteButtons = screen.getAllByRole('button', { name: /刪除/i })
      expect(deleteButtons).toHaveLength(3)
    })

    it('點擊刪除按鈕應觸發 onDelete', () => {
      const onDelete = vi.fn()
      render(<TaskHistory tasks={mockTasks} onDelete={onDelete} />)

      const deleteButtons = screen.getAllByRole('button', { name: /刪除/i })
      deleteButtons[0].click()

      expect(onDelete).toHaveBeenCalledWith('1')
    })

    it('無 onDelete 時不應顯示刪除按鈕', () => {
      render(<TaskHistory tasks={mockTasks} />)
      expect(screen.queryByRole('button', { name: /刪除/i })).not.toBeInTheDocument()
    })
  })
})
