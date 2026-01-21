import Store from 'electron-store'
import type { WindowMode, WindowSettings } from '../../shared/types'

interface StoreSchema {
  mode: WindowMode
  floatingPosition: { x: number; y: number } | null
}

/**
 * 視窗設定儲存服務
 */
export class WindowSettingsStore {
  private store: Store<StoreSchema>

  constructor() {
    this.store = new Store<StoreSchema>({
      name: 'window-settings',
      defaults: {
        mode: 'popover',
        floatingPosition: null,
      },
    })
  }

  getMode(): WindowMode {
    return this.store.get('mode')
  }

  setMode(mode: WindowMode): void {
    this.store.set('mode', mode)
  }

  getFloatingPosition(): { x: number; y: number } | null {
    return this.store.get('floatingPosition')
  }

  setFloatingPosition(position: { x: number; y: number }): void {
    this.store.set('floatingPosition', position)
  }

  getAll(): WindowSettings {
    return {
      mode: this.getMode(),
      floatingPosition: this.getFloatingPosition(),
    }
  }
}
