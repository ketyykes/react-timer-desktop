import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { TaskRecord } from '../../../shared/types'
import { IPC_CHANNELS } from '../../../shared/types'

// Mock electron
const mockHandle = vi.fn()
const mockRemoveHandler = vi.fn()

vi.mock('electron', () => ({
  ipcMain: {
    handle: mockHandle,
    removeHandler: mockRemoveHandler,
  },
}))

// Mock TaskStore
const mockSave = vi.fn()
const mockGetAll = vi.fn()
const mockDelete = vi.fn()

vi.mock('../../store/TaskStore', () => ({
  TaskStore: vi.fn().mockImplementation(() => ({
    save: mockSave,
    getAll: mockGetAll,
    delete: mockDelete,
  })),
}))

describe('TaskIpcHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('constructor', () => {
    it('應成功建立實例', async () => {
      const { TaskIpcHandler } = await import('../taskHandlers')
      const { TaskStore } = await import('../../store/TaskStore')
      const store = new TaskStore()
      expect(() => new TaskIpcHandler(store)).not.toThrow()
    })
  })

  describe('register()', () => {
    it('應註冊所有 task IPC 處理器', async () => {
      const { TaskIpcHandler } = await import('../taskHandlers')
      const { TaskStore } = await import('../../store/TaskStore')
      const store = new TaskStore()
      const handler = new TaskIpcHandler(store)

      handler.register()

      expect(mockHandle).toHaveBeenCalledWith(IPC_CHANNELS.TASK_SAVE, expect.any(Function))
      expect(mockHandle).toHaveBeenCalledWith(IPC_CHANNELS.TASK_GET_ALL, expect.any(Function))
      expect(mockHandle).toHaveBeenCalledWith(IPC_CHANNELS.TASK_DELETE, expect.any(Function))
    })
  })

  describe('unregister()', () => {
    it('應取消註冊所有 task IPC 處理器', async () => {
      const { TaskIpcHandler } = await import('../taskHandlers')
      const { TaskStore } = await import('../../store/TaskStore')
      const store = new TaskStore()
      const handler = new TaskIpcHandler(store)

      handler.unregister()

      expect(mockRemoveHandler).toHaveBeenCalledWith(IPC_CHANNELS.TASK_SAVE)
      expect(mockRemoveHandler).toHaveBeenCalledWith(IPC_CHANNELS.TASK_GET_ALL)
      expect(mockRemoveHandler).toHaveBeenCalledWith(IPC_CHANNELS.TASK_DELETE)
    })
  })

  describe('IPC Handlers', () => {
    it('TASK_SAVE 應呼叫 store.save()', async () => {
      const mockTask: TaskRecord = {
        id: 'test-id',
        name: '測試任務',
        duration: 300000,
        actualTime: 305000,
        createdAt: Date.now(),
      }
      mockSave.mockReturnValue(mockTask)

      const { TaskIpcHandler } = await import('../taskHandlers')
      const { TaskStore } = await import('../../store/TaskStore')
      const store = new TaskStore()
      const handler = new TaskIpcHandler(store)

      handler.register()

      // 取得註冊的處理函式
      const saveHandler = mockHandle.mock.calls.find(
        (call) => call[0] === IPC_CHANNELS.TASK_SAVE
      )?.[1]

      expect(saveHandler).toBeDefined()

      const input = { name: '測試任務', duration: 300000, actualTime: 305000 }
      const result = await saveHandler(null, input)

      expect(mockSave).toHaveBeenCalledWith(input)
      expect(result).toEqual(mockTask)
    })

    it('TASK_GET_ALL 應呼叫 store.getAll()', async () => {
      const mockTasks: TaskRecord[] = [
        { id: '1', name: '任務1', duration: 100000, actualTime: 100000, createdAt: 1000 },
      ]
      mockGetAll.mockReturnValue(mockTasks)

      const { TaskIpcHandler } = await import('../taskHandlers')
      const { TaskStore } = await import('../../store/TaskStore')
      const store = new TaskStore()
      const handler = new TaskIpcHandler(store)

      handler.register()

      const getAllHandler = mockHandle.mock.calls.find(
        (call) => call[0] === IPC_CHANNELS.TASK_GET_ALL
      )?.[1]

      expect(getAllHandler).toBeDefined()

      const result = await getAllHandler(null)

      expect(mockGetAll).toHaveBeenCalled()
      expect(result).toEqual(mockTasks)
    })

    it('TASK_DELETE 應呼叫 store.delete()', async () => {
      mockDelete.mockReturnValue(true)

      const { TaskIpcHandler } = await import('../taskHandlers')
      const { TaskStore } = await import('../../store/TaskStore')
      const store = new TaskStore()
      const handler = new TaskIpcHandler(store)

      handler.register()

      const deleteHandler = mockHandle.mock.calls.find(
        (call) => call[0] === IPC_CHANNELS.TASK_DELETE
      )?.[1]

      expect(deleteHandler).toBeDefined()

      const result = await deleteHandler(null, 'test-id')

      expect(mockDelete).toHaveBeenCalledWith('test-id')
      expect(result).toBe(true)
    })
  })

  describe('getTaskStore()', () => {
    it('應回傳 TaskStore 實例', async () => {
      const { TaskIpcHandler } = await import('../taskHandlers')
      const { TaskStore } = await import('../../store/TaskStore')
      const store = new TaskStore()
      const handler = new TaskIpcHandler(store)

      expect(handler.getTaskStore()).toBe(store)
    })
  })
})
