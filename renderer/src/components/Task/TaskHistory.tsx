import type { TaskRecord } from '../../../../shared/types'
import { formatTime } from '../../../../shared/types'
import { Button } from '@/components/ui/button'

export interface TaskHistoryProps {
  /** 任務記錄陣列 */
  tasks: TaskRecord[]
  /** 刪除任務 */
  onDelete?: (id: string) => void
}

/**
 * 格式化日期為 YYYY/MM/DD HH:MM 格式
 */
function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${year}/${month}/${day} ${hours}:${minutes}`
}

/**
 * 任務歷史清單
 * 顯示歷史任務記錄，依時間倒序排列
 */
export function TaskHistory({ tasks, onDelete }: TaskHistoryProps) {
  // 排序：依 createdAt 倒序
  const sortedTasks = [...tasks].sort((a, b) => b.createdAt - a.createdAt)

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">任務歷史</h2>

      {sortedTasks.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">尚無任務記錄</p>
      ) : (
        <ul className="space-y-2">
          {sortedTasks.map((task) => (
            <li
              key={task.id}
              data-testid="task-item"
              className="flex items-center justify-between p-3 rounded-lg border bg-card"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{task.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatTime(task.duration)} · {formatDate(task.createdAt)}
                </p>
              </div>

              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-2 text-destructive hover:text-destructive"
                  onClick={() => onDelete(task.id)}
                  aria-label="刪除"
                >
                  刪除
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
