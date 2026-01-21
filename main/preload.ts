import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'
import { IPC_CHANNELS, TimerData, TimerState, TimerMode, TaskRecord, WindowMode } from '../shared/types'

/**
 * 計時器狀態變更事件資料
 */
export interface TimerStateChangeData {
  previousState: TimerState
  currentState: TimerState
}

/**
 * 計時器完成事件資料
 */
export interface TimerCompleteData {
  duration: number
  actualElapsed: number
  mode: TimerMode
}

/**
 * 定義暴露給渲染程序的 API
 */
export const electronAPI = {
  // 計時器相關 IPC
  timer: {
    start: (duration: number, mode: TimerMode = 'countdown'): Promise<TimerData> =>
      ipcRenderer.invoke(IPC_CHANNELS.TIMER_START, duration, mode),
    pause: (): Promise<TimerData> => ipcRenderer.invoke(IPC_CHANNELS.TIMER_PAUSE),
    resume: (): Promise<TimerData> => ipcRenderer.invoke(IPC_CHANNELS.TIMER_RESUME),
    stop: (): Promise<TimerData> => ipcRenderer.invoke(IPC_CHANNELS.TIMER_STOP),
    reset: (): Promise<TimerData> => ipcRenderer.invoke(IPC_CHANNELS.TIMER_RESET),
    onTick: (callback: (data: TimerData) => void): (() => void) => {
      const handler = (_event: IpcRendererEvent, data: TimerData) => callback(data)
      ipcRenderer.on(IPC_CHANNELS.TIMER_TICK, handler)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.TIMER_TICK, handler)
    },
    onStateChange: (callback: (data: TimerStateChangeData) => void): (() => void) => {
      const handler = (_event: IpcRendererEvent, data: TimerStateChangeData) => callback(data)
      ipcRenderer.on(IPC_CHANNELS.TIMER_STATE_CHANGE, handler)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.TIMER_STATE_CHANGE, handler)
    },
    onComplete: (callback: (data: TimerCompleteData) => void): (() => void) => {
      const handler = (_event: IpcRendererEvent, data: TimerCompleteData) => callback(data)
      ipcRenderer.on(IPC_CHANNELS.TIMER_COMPLETE, handler)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.TIMER_COMPLETE, handler)
    },
    onStopFromTray: (callback: (data: TimerCompleteData) => void): (() => void) => {
      const handler = (_event: IpcRendererEvent, data: TimerCompleteData) => callback(data)
      ipcRenderer.on(IPC_CHANNELS.TIMER_STOP_FROM_TRAY, handler)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.TIMER_STOP_FROM_TRAY, handler)
    },
  },
  // 任務相關 IPC
  task: {
    save: (task: Omit<TaskRecord, 'id' | 'createdAt'>): Promise<TaskRecord> =>
      ipcRenderer.invoke(IPC_CHANNELS.TASK_SAVE, task),
    getAll: (): Promise<TaskRecord[]> => ipcRenderer.invoke(IPC_CHANNELS.TASK_GET_ALL),
    delete: (id: string): Promise<boolean> => ipcRenderer.invoke(IPC_CHANNELS.TASK_DELETE, id),
    update: (data: { id: string; name: string }): Promise<TaskRecord> =>
      ipcRenderer.invoke(IPC_CHANNELS.TASK_UPDATE, data),
  },
  // 歷史記錄視窗
  history: {
    open: (): Promise<void> => ipcRenderer.invoke(IPC_CHANNELS.HISTORY_OPEN),
  },
  // 視窗控制
  window: {
    togglePin: (): Promise<WindowMode> => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_PIN),
    getMode: (): Promise<WindowMode> => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_GET_MODE),
    onModeChange: (callback: (mode: WindowMode) => void): (() => void) => {
      const handler = (_event: IpcRendererEvent, mode: WindowMode) => callback(mode)
      ipcRenderer.on(IPC_CHANNELS.WINDOW_MODE_CHANGE, handler)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.WINDOW_MODE_CHANGE, handler)
    },
  },
  // 版本資訊
  versions: {
    node: () => process.versions.node,
    chrome: () => process.versions.chrome,
    electron: () => process.versions.electron,
  },
}

// 使用 contextBridge 安全地暴露 API 給渲染程序
contextBridge.exposeInMainWorld('electronAPI', electronAPI)

// 型別定義，供渲染程序使用
export type ElectronAPI = typeof electronAPI
