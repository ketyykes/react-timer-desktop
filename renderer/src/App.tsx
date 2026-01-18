import { useState, useEffect, useCallback } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Timer } from '@/components/Timer'
import { TaskDialog } from '@/components/Task/TaskDialog'
import { TaskHistory } from '@/components/Task/TaskHistory'
import type { TaskRecord, TimerMode } from '../../shared/types'

const App = () => {
  // Tab 狀態
  const [activeTab, setActiveTab] = useState<'timer' | 'history'>('timer')

  // TaskDialog 狀態
  const [taskDialogOpen, setTaskDialogOpen] = useState(false)
  const [completedTask, setCompletedTask] = useState<{
    duration: number
    actualTime: number
    description: string
  } | null>(null)

  // 任務歷史
  const [tasks, setTasks] = useState<TaskRecord[]>([])

  // 任務描述（傳給 Timer）
  const [taskDescription, setTaskDescription] = useState('')

  // 載入任務歷史
  const loadTasks = useCallback(async () => {
    const api = window.electronAPI?.task
    if (api) {
      const allTasks = await api.getAll()
      setTasks(allTasks)
    }
  }, [])

  // 切換到歷史記錄時載入
  useEffect(() => {
    if (activeTab === 'history') {
      loadTasks()
    }
  }, [activeTab, loadTasks])

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
        }
      }
      setTaskDialogOpen(false)
      setCompletedTask(null)
      setTaskDescription('')
    },
    [completedTask]
  )

  // 處理取消/跳過
  const handleTaskCancel = useCallback(() => {
    setTaskDialogOpen(false)
    setCompletedTask(null)
    setTaskDescription('')
  }, [])

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

  return (
    <div className="h-full bg-white flex flex-col p-4">
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as 'timer' | 'history')}
        className="flex-1 flex flex-col"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="timer">計時器</TabsTrigger>
          <TabsTrigger value="history">歷史記錄</TabsTrigger>
        </TabsList>

        <TabsContent value="timer" className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-xs">
            <Timer
              taskDescription={taskDescription}
              onTaskDescriptionChange={setTaskDescription}
              onStop={handleTimerStop}
            />
          </div>
        </TabsContent>

        <TabsContent value="history" className="flex-1 overflow-auto">
          <TaskHistory tasks={tasks} onDelete={handleTaskDelete} />
        </TabsContent>
      </Tabs>

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
