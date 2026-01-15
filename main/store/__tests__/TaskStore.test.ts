import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { TaskRecord } from '../../../shared/types'

// Mock electron-store
const mockGet = vi.fn()
const mockSet = vi.fn()

vi.mock('electron-store', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      get: mockGet,
      set: mockSet,
    })),
  }
})

// Mock crypto.randomUUID
const mockRandomUUID = vi.fn(() => 'test-uuid-123')
vi.stubGlobal('crypto', { randomUUID: mockRandomUUID })

describe('TaskStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGet.mockReturnValue([])
  })

  describe('constructor', () => {
    it('應成功建立實例', async () => {
      const { TaskStore } = await import('../TaskStore')
      expect(() => new TaskStore()).not.toThrow()
    })
  })

  describe('save()', () => {
    it('應儲存任務記錄', async () => {
      const { TaskStore } = await import('../TaskStore')
      const store = new TaskStore()

      const task: Omit<TaskRecord, 'id' | 'createdAt'> = {
        name: '測試任務',
        duration: 300000,
        actualTime: 305000,
      }

      const result = store.save(task)

      expect(result.id).toBe('test-uuid-123')
      expect(result.name).toBe('測試任務')
      expect(result.duration).toBe(300000)
      expect(result.actualTime).toBe(305000)
      expect(result.createdAt).toBeDefined()
      expect(mockSet).toHaveBeenCalledWith('tasks', expect.any(Array))
    })

    it('應使用預設名稱當名稱為空', async () => {
      const { TaskStore } = await import('../TaskStore')
      const store = new TaskStore()

      const task: Omit<TaskRecord, 'id' | 'createdAt'> = {
        name: '',
        duration: 300000,
        actualTime: 305000,
      }

      const result = store.save(task)

      expect(result.name).toBe('未命名任務')
    })

    it('應在現有任務清單前新增', async () => {
      mockGet.mockReturnValue([
        { id: 'old-task', name: '舊任務', duration: 100000, actualTime: 100000, createdAt: 1000 },
      ])

      const { TaskStore } = await import('../TaskStore')
      const store = new TaskStore()

      store.save({
        name: '新任務',
        duration: 200000,
        actualTime: 200000,
      })

      expect(mockSet).toHaveBeenCalledWith('tasks', expect.arrayContaining([
        expect.objectContaining({ name: '新任務' }),
        expect.objectContaining({ name: '舊任務' }),
      ]))
    })
  })

  describe('getAll()', () => {
    it('應回傳所有任務記錄', async () => {
      const tasks: TaskRecord[] = [
        { id: '1', name: '任務1', duration: 100000, actualTime: 100000, createdAt: 2000 },
        { id: '2', name: '任務2', duration: 200000, actualTime: 200000, createdAt: 1000 },
      ]
      mockGet.mockReturnValue(tasks)

      const { TaskStore } = await import('../TaskStore')
      const store = new TaskStore()

      const result = store.getAll()

      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('任務1')
      expect(result[1].name).toBe('任務2')
    })

    it('無任務時應回傳空陣列', async () => {
      mockGet.mockReturnValue([])

      const { TaskStore } = await import('../TaskStore')
      const store = new TaskStore()

      const result = store.getAll()

      expect(result).toEqual([])
    })

    it('應依時間倒序排列', async () => {
      const tasks: TaskRecord[] = [
        { id: '1', name: '舊任務', duration: 100000, actualTime: 100000, createdAt: 1000 },
        { id: '2', name: '新任務', duration: 200000, actualTime: 200000, createdAt: 2000 },
      ]
      mockGet.mockReturnValue(tasks)

      const { TaskStore } = await import('../TaskStore')
      const store = new TaskStore()

      const result = store.getAll()

      // 應該依 createdAt 倒序
      expect(result[0].name).toBe('新任務')
      expect(result[1].name).toBe('舊任務')
    })
  })

  describe('delete()', () => {
    it('應刪除指定任務', async () => {
      const tasks: TaskRecord[] = [
        { id: '1', name: '任務1', duration: 100000, actualTime: 100000, createdAt: 2000 },
        { id: '2', name: '任務2', duration: 200000, actualTime: 200000, createdAt: 1000 },
      ]
      mockGet.mockReturnValue(tasks)

      const { TaskStore } = await import('../TaskStore')
      const store = new TaskStore()

      const result = store.delete('1')

      expect(result).toBe(true)
      expect(mockSet).toHaveBeenCalledWith('tasks', [
        expect.objectContaining({ id: '2' }),
      ])
    })

    it('刪除不存在的任務應回傳 false', async () => {
      mockGet.mockReturnValue([])

      const { TaskStore } = await import('../TaskStore')
      const store = new TaskStore()

      const result = store.delete('not-exist')

      expect(result).toBe(false)
    })
  })

  describe('clear()', () => {
    it('應清除所有任務', async () => {
      const { TaskStore } = await import('../TaskStore')
      const store = new TaskStore()

      store.clear()

      expect(mockSet).toHaveBeenCalledWith('tasks', [])
    })
  })
})
