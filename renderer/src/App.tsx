import { useState, useEffect, useCallback } from 'react'
import { Timer } from '@/components/Timer'
import { TaskDialog } from '@/components/Task/TaskDialog'
import { TodayTasks } from '@/components/Task/TodayTasks'
import type { TaskRecord, TimerMode } from '../../shared/types'

/**
 * 判斷時間戳是否為今天
 */
function isToday(timestamp: number): boolean {
  const date = new Date(timestamp)
  const today = new Date()
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  )
}

const App = () => {
  // TaskDialog 狀態
  const [taskDialogOpen, setTaskDialogOpen] = useState(false)
  const [completedTask, setCompletedTask] = useState<{
    duration: number
    actualTime: number
    description: string
  } | null>(null)

  // 今日任務
  const [tasks, setTasks] = useState<TaskRecord[]>([])

  // 任務描述（傳給 Timer）
  const [taskDescription, setTaskDescription] = useState('')

  // 載入今日任務
  const loadTasks = useCallback(async () => {
    const api = window.electronAPI?.task
    if (api) {
      const allTasks = await api.getAll()
      // 只保留今天的任務
      setTasks(allTasks.filter((t) => isToday(t.createdAt)))
    }
  }, [])

  // 初始載入
  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  // 處理計時器停止（用戶按下停止按鈕時）
  const handleTimerStop = useCallback(
    (data: { duration: number; actualElapsed: number; mode: TimerMode }) => {
      setCompletedTask({
        duration: data.duration,
        actualTime: data.actualElapsed,
        description: taskDescription,
      })
      setTaskDialogOpen(true)
    },
    [taskDescription]
  )

  // 處理任務儲存
  const handleTaskConfirm = useCallback(
    async (name: string) => {
      if (completedTask) {
        const api = window.electronAPI?.task
        if (api) {
          await api.save({
            name: name || '未命名任務',
            duration: completedTask.duration,
            actualTime: completedTask.actualTime,
          })
          await loadTasks()
        }
      }
      setTaskDialogOpen(false)
      setCompletedTask(null)
      setTaskDescription('')
    },
    [completedTask, loadTasks]
  )

  // 處理取消/跳過
  const handleTaskCancel = useCallback(() => {
    setTaskDialogOpen(false)
    setCompletedTask(null)
    setTaskDescription('')
  }, [])

  // 處理更新任務
  const handleTaskUpdate = useCallback(
    async (id: string, name: string) => {
      const api = window.electronAPI?.task
      if (api?.update) {
        await api.update({ id, name })
        await loadTasks()
      }
    },
    [loadTasks]
  )

  // 處理刪除任務
  const handleTaskDelete = useCallback(
    async (id: string) => {
      const api = window.electronAPI?.task
      if (api) {
        await api.delete(id)
        await loadTasks()
      }
    },
    [loadTasks]
  )

  // 處理查看全部
  const handleViewAll = useCallback(() => {
    window.electronAPI?.history?.open()
  }, [])

  return (
    <div className="h-full bg-white flex flex-col">
      {/* 計時器區塊 (75%) */}
      <div className="flex-[3] flex items-center justify-center p-4">
        <div className="w-full max-w-xs">
          <Timer
            taskDescription={taskDescription}
            onTaskDescriptionChange={setTaskDescription}
            onStop={handleTimerStop}
          />
        </div>
      </div>

      {/* 分隔線 */}
      <div className="border-t border-gray-200" />

      {/* 今日記錄區塊 (25%) */}
      <div className="flex-1 p-3 bg-gray-50/50">
        <TodayTasks
          tasks={tasks}
          onUpdate={handleTaskUpdate}
          onDelete={handleTaskDelete}
          onViewAll={handleViewAll}
        />
      </div>

      <TaskDialog
        open={taskDialogOpen}
        duration={completedTask?.duration ?? 0}
        actualTime={completedTask?.actualTime ?? 0}
        defaultName={completedTask?.description ?? ''}
        onConfirm={handleTaskConfirm}
        onCancel={handleTaskCancel}
      />
    </div>
  )
}

export default App
