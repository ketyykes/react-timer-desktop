import { ipcMain } from 'electron'
import { IPC_CHANNELS, type TaskRecord } from '../../shared/types'
import { TaskStore } from '../store/TaskStore'

/**
 * 任務 IPC 處理器
 * 負責主程序與渲染程序之間的任務儲存通訊
 */
export class TaskIpcHandler {
  private taskStore: TaskStore

  constructor(taskStore: TaskStore) {
    this.taskStore = taskStore
  }

  /**
   * 註冊 IPC 處理器
   */
  register(): void {
    ipcMain.handle(
      IPC_CHANNELS.TASK_SAVE,
      (_event, task: Omit<TaskRecord, 'id' | 'createdAt'>) => {
        return this.taskStore.save(task)
      }
    )

    ipcMain.handle(IPC_CHANNELS.TASK_GET_ALL, () => {
      return this.taskStore.getAll()
    })

    ipcMain.handle(IPC_CHANNELS.TASK_DELETE, (_event, id: string) => {
      return this.taskStore.delete(id)
    })

    ipcMain.handle(
      IPC_CHANNELS.TASK_UPDATE,
      (_event, data: { id: string; name: string }) => {
        return this.taskStore.update(data.id, { name: data.name })
      }
    )
  }

  /**
   * 取消註冊 IPC 處理器
   */
  unregister(): void {
    ipcMain.removeHandler(IPC_CHANNELS.TASK_SAVE)
    ipcMain.removeHandler(IPC_CHANNELS.TASK_GET_ALL)
    ipcMain.removeHandler(IPC_CHANNELS.TASK_DELETE)
    ipcMain.removeHandler(IPC_CHANNELS.TASK_UPDATE)
  }

  /**
   * 取得 TaskStore 實例
   */
  getTaskStore(): TaskStore {
    return this.taskStore
  }
}

/**
 * 建立 TaskIpcHandler 實例
 */
export function createTaskIpcHandler(taskStore: TaskStore): TaskIpcHandler {
  return new TaskIpcHandler(taskStore)
}
