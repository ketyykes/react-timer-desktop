import { contextBridge, ipcRenderer } from 'electron'

/**
 * 定義暴露給渲染程序的 API
 */
export const electronAPI = {
  // 計時器相關 IPC（後續 P3 實作）
  timer: {
    start: (duration: number) => ipcRenderer.send('timer:start', duration),
    pause: () => ipcRenderer.send('timer:pause'),
    resume: () => ipcRenderer.send('timer:resume'),
    stop: () => ipcRenderer.send('timer:stop'),
    onTick: (callback: (remaining: number) => void) => {
      ipcRenderer.on('timer:tick', (_event, remaining) => callback(remaining))
    },
    onComplete: (callback: () => void) => {
      ipcRenderer.on('timer:complete', () => callback())
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
