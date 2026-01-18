import { useState, useCallback } from 'react'
import type { TaskRecord } from '../../../../shared/types'
import { formatTime } from '../../../../shared/types'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

export interface TodayTasksProps {
  tasks: TaskRecord[]
  onUpdate: (id: string, name: string) => void
  onDelete: (id: string) => void
  onViewAll: () => void
}

function formatTimeOfDay(timestamp: number): string {
  const date = new Date(timestamp)
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

export function TodayTasks({ tasks, onUpdate, onDelete, onViewAll }: TodayTasksProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // 只顯示最近 3 筆
  const displayTasks = [...tasks]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 3)

  const handleNameClick = useCallback((task: TaskRecord) => {
    setEditingId(task.id)
    setEditValue(task.name)
    setDeletingId(null)
  }, [])

  const handleEditSubmit = useCallback(() => {
    if (editingId && editValue.trim()) {
      onUpdate(editingId, editValue.trim())
    }
    setEditingId(null)
  }, [editingId, editValue, onUpdate])

  const handleEditKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleEditSubmit()
      } else if (e.key === 'Escape') {
        setEditingId(null)
      }
    },
    [handleEditSubmit]
  )

  const handleDeleteClick = useCallback((id: string) => {
    setDeletingId(id)
    setEditingId(null)
  }, [])

  const handleDeleteConfirm = useCallback(() => {
    if (deletingId) {
      onDelete(deletingId)
    }
    setDeletingId(null)
  }, [deletingId, onDelete])

  const handleDeleteCancel = useCallback(() => {
    setDeletingId(null)
  }, [])

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">今日</span>
        <Button variant="link" size="sm" className="h-auto p-0" onClick={onViewAll}>
          查看全部
        </Button>
      </div>

      {displayTasks.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          今天還沒有完成任務
        </p>
      ) : (
        <ul className="space-y-1">
          {displayTasks.map((task) => (
            <li
              key={task.id}
              data-testid="today-task-item"
              className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-white/50 text-sm"
            >
              {deletingId === task.id ? (
                // 刪除確認狀態
                <div className="flex-1 flex items-center justify-between">
                  <span className="truncate">{task.name}</span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={handleDeleteCancel}
                    >
                      取消
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={handleDeleteConfirm}
                    >
                      確認刪除
                    </Button>
                  </div>
                </div>
              ) : editingId === task.id ? (
                // 編輯狀態
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleEditKeyDown}
                  onBlur={handleEditSubmit}
                  autoFocus
                  className="flex-1 bg-transparent border-b border-blue-500 outline-none text-sm"
                />
              ) : (
                // 正常狀態
                <>
                  <span
                    className="flex-1 truncate cursor-pointer hover:text-blue-600"
                    onClick={() => handleNameClick(task)}
                  >
                    {task.name}
                  </span>
                  <span className="text-muted-foreground tabular-nums">
                    {formatTime(task.duration)}
                  </span>
                  <span className="text-muted-foreground tabular-nums">
                    {formatTimeOfDay(task.createdAt)}
                  </span>
                  <button
                    aria-label="刪除"
                    onClick={() => handleDeleteClick(task.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
