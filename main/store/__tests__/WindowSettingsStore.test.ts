import { describe, it, expect, beforeEach, vi } from 'vitest'
import { WindowSettingsStore } from '../WindowSettingsStore'

// Mock electron-store
vi.mock('electron-store', () => {
  return {
    default: vi.fn().mockImplementation(() => {
      const data: Record<string, unknown> = {
        mode: 'popover',
        floatingPosition: null,
      }
      return {
        get: vi.fn((key: string) => data[key]),
        set: vi.fn((key: string, value: unknown) => {
          data[key] = value
        }),
      }
    }),
  }
})

describe('WindowSettingsStore', () => {
  let store: WindowSettingsStore

  beforeEach(() => {
    vi.clearAllMocks()
    store = new WindowSettingsStore()
  })

  describe('getMode', () => {
    it('returns default mode as popover', () => {
      expect(store.getMode()).toBe('popover')
    })
  })

  describe('setMode', () => {
    it('saves floating mode', () => {
      store.setMode('floating')
      expect(store.getMode()).toBe('floating')
    })
  })

  describe('getFloatingPosition', () => {
    it('returns null by default', () => {
      expect(store.getFloatingPosition()).toBeNull()
    })
  })

  describe('setFloatingPosition', () => {
    it('saves position', () => {
      store.setFloatingPosition({ x: 100, y: 200 })
      expect(store.getFloatingPosition()).toEqual({ x: 100, y: 200 })
    })
  })

  describe('getAll', () => {
    it('returns all settings', () => {
      const settings = store.getAll()
      expect(settings).toHaveProperty('mode')
      expect(settings).toHaveProperty('floatingPosition')
    })
  })
})
