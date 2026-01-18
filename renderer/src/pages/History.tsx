import { useState, useEffect, useCallback } from 'react'
import type { TaskRecord } from '../../../shared/types'
import { formatTime } from '../../../shared/types'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronRight, Pencil, X } from 'lucide-react'

interface DateGroup {
  label: string
  date: string
  tasks: TaskRecord[]
}

function formatDateLabel(date: Date): string {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) return '今天'
  if (date.toDateString() === yesterday.toDateString()) return '昨天'
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

function groupByDate(tasks: TaskRecord[]): DateGroup[] {
  const groups = new Map<string, TaskRecord[]>()

  tasks.forEach((task) => {
    const date = new Date(task.createdAt)
    const key = date.toDateString()
    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key)!.push(task)
  })

  return Array.from(groups.entries())
    .map(([dateStr, tasks]) => ({
      label: formatDateLabel(new Date(dateStr)),
      date: dateStr,
      tasks: tasks.sort((a, b) => b.createdAt - a.createdAt),
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function History() {
  const [tasks, setTasks] = useState<TaskRecord[]>([])
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadTasks = useCallback(async () => {
    const api = window.electronAPI?.task
    if (api) {
      const allTasks = await api.getAll()
      setTasks(allTasks)
      // 預設展開今天
      const today = new Date().toDateString()
      setExpandedDates(new Set([today]))
    }
  }, [])

  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  const groups = groupByDate(tasks)

  const toggleDate = useCallback((date: string) => {
    setExpandedDates((prev) => {
      const next = new Set(prev)
      if (next.has(date)) {
        next.delete(date)
      } else {
        next.add(date)
      }
      return next
    })
  }, [])

  const handleEdit = useCallback((task: TaskRecord) => {
    setEditingId(task.id)
    setEditValue(task.name)
    setDeletingId(null)
  }, [])

  const handleEditSubmit = useCallback(async () => {
    if (editingId && editValue.trim()) {
      await window.electronAPI?.task?.update({ id: editingId, name: editValue.trim() })
      await loadTasks()
    }
    setEditingId(null)
  }, [editingId, editValue, loadTasks])

  const handleDelete = useCallback((id: string) => {
    setDeletingId(id)
    setEditingId(null)
  }, [])

  const handleDeleteConfirm = useCallback(async () => {
    if (deletingId) {
      await window.electronAPI?.task?.delete(deletingId)
      await loadTasks()
    }
    setDeletingId(null)
  }, [deletingId, loadTasks])

  if (tasks.length === 0) {
    return (
      <div className="h-full flex flex-col bg-white">
        <div className="p-4 border-b">
          <h1 className="text-lg font-semibold">歷史記錄</h1>
        </div>
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          沒有歷史記錄
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-4 border-b">
        <h1 className="text-lg font-semibold">歷史記錄</h1>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-2">
        {groups.map((group) => (
          <div key={group.date}>
            <button
              onClick={() => toggleDate(group.date)}
              className="flex items-center gap-2 w-full py-2 text-left font-medium hover:bg-muted/50 rounded"
            >
              {expandedDates.has(group.date) ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              {group.label} ({group.tasks.length})
            </button>

            {expandedDates.has(group.date) && (
              <ul className="ml-6 space-y-1">
                {group.tasks.map((task) => (
                  <li
                    key={task.id}
                    className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-muted/50 text-sm"
                  >
                    {deletingId === task.id ? (
                      <div className="flex-1 flex items-center justify-between">
                        <span>{task.name}</span>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() => setDeletingId(null)}
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
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleEditSubmit()
                          if (e.key === 'Escape') setEditingId(null)
                        }}
                        onBlur={handleEditSubmit}
                        autoFocus
                        className="flex-1 bg-transparent border-b border-blue-500 outline-none"
                      />
                    ) : (
                      <>
                        <span className="flex-1 truncate">{task.name}</span>
                        <span className="text-muted-foreground tabular-nums">
                          {formatTime(task.duration)}
                        </span>
                        <button
                          onClick={() => handleEdit(task)}
                          className="text-muted-foreground hover:text-blue-600"
                          aria-label={`編輯 ${task.name}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(task.id)}
                          className="text-muted-foreground hover:text-destructive"
                          aria-label={`刪除 ${task.name}`}
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
        ))}
      </div>
    </div>
  )
}
