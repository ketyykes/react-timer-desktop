import Store from 'electron-store'
import type { TaskRecord } from '../../shared/types'

interface StoreSchema {
  tasks: TaskRecord[]
}

/**
 * 任務儲存服務
 * 使用 electron-store 進行本地持久化儲存
 */
export class TaskStore {
  private store: Store<StoreSchema>

  constructor() {
    this.store = new Store<StoreSchema>({
      name: 'task-records',
      defaults: {
        tasks: [],
      },
    })
  }

  /**
   * 儲存任務記錄
   * @param task 任務資料（不含 id 和 createdAt）
   * @returns 完整的任務記錄
   */
  save(task: Omit<TaskRecord, 'id' | 'createdAt'>): TaskRecord {
    const newTask: TaskRecord = {
      id: crypto.randomUUID(),
      name: task.name.trim() || '未命名任務',
      duration: task.duration,
      actualTime: task.actualTime,
      createdAt: Date.now(),
    }

    const tasks = this.store.get('tasks')
    // 新任務放在最前面（時間倒序）
    this.store.set('tasks', [newTask, ...tasks])

    return newTask
  }

  /**
   * 取得所有任務記錄
   * @returns 任務記錄陣列（依時間倒序）
   */
  getAll(): TaskRecord[] {
    const tasks = this.store.get('tasks')
    // 確保依 createdAt 倒序排列
    return [...tasks].sort((a, b) => b.createdAt - a.createdAt)
  }

  /**
   * 刪除指定任務
   * @param id 任務 ID
   * @returns 是否成功刪除
   */
  delete(id: string): boolean {
    const tasks = this.store.get('tasks')
    const filteredTasks = tasks.filter((task) => task.id !== id)

    if (filteredTasks.length === tasks.length) {
      return false
    }

    this.store.set('tasks', filteredTasks)
    return true
  }

  /**
   * 更新任務記錄
   * @param id 任務 ID
   * @param data 要更新的資料
   * @returns 更新後的任務記錄
   * @throws 找不到任務時拋出錯誤
   */
  update(id: string, data: { name: string }): TaskRecord {
    const tasks = this.store.get('tasks') as TaskRecord[]
    const index = tasks.findIndex((t) => t.id === id)
    if (index === -1) {
      throw new Error(`Task not found: ${id}`)
    }
    tasks[index] = { ...tasks[index], ...data }
    this.store.set('tasks', tasks)
    return tasks[index]
  }

  /**
   * 清除所有任務
   */
  clear(): void {
    this.store.set('tasks', [])
  }
}
