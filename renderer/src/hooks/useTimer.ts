import { useState, useCallback, useEffect } from 'react'
import type { TimerState, TimerMode, TimerData } from '../../../shared/types'

/**
 * useTimer hook 回傳型別
 */
export interface UseTimerReturn {
  /** 計時器狀態 */
  state: TimerState
  /** 計時模式 */
  mode: TimerMode
  /** 設定的持續時間（毫秒） */
  duration: number
  /** 剩餘時間（毫秒） */
  remaining: number
  /** 已經過時間（毫秒） */
  elapsed: number
  /** 是否超時 */
  isOvertime: boolean
  /** 顯示用時間（毫秒） */
  displayTime: number
  /** 開始計時 */
  start: (duration: number, mode?: TimerMode) => Promise<void>
  /** 暫停計時 */
  pause: () => Promise<void>
  /** 繼續計時 */
  resume: () => Promise<void>
  /** 停止計時 */
  stop: () => Promise<void>
  /** 重置計時 */
  reset: () => Promise<void>
  /** 訂閱計時完成事件 */
  subscribeComplete: (callback: (data: { duration: number; actualElapsed: number; mode: TimerMode }) => void) => () => void
}

/**
 * Electron API 型別定義
 */
interface ElectronTimerAPI {
  start: (duration: number, mode?: TimerMode) => Promise<TimerData>
  pause: () => Promise<TimerData>
  resume: () => Promise<TimerData>
  stop: () => Promise<TimerData>
  reset: () => Promise<TimerData>
  onTick: (callback: (data: TimerData) => void) => () => void
  onStateChange: (callback: (data: { previousState: TimerState; currentState: TimerState }) => void) => () => void
  onComplete: (callback: (data: { duration: number; actualElapsed: number; mode: TimerMode }) => void) => () => void
}

declare global {
  interface Window {
    electronAPI?: {
      timer: ElectronTimerAPI
    }
  }
}

/**
 * 預設計時器資料
 */
const defaultTimerData: TimerData = {
  state: 'idle',
  mode: 'countdown',
  duration: 0,
  remaining: 0,
  elapsed: 0,
  isOvertime: false,
  displayTime: 0,
}

/**
 * 計時器 Hook
 * 提供計時器狀態和控制方法，透過 IPC 與主程序通訊
 */
export function useTimer(): UseTimerReturn {
  const [timerData, setTimerData] = useState<TimerData>(defaultTimerData)

  // 取得 Electron API
  const getTimerAPI = useCallback((): ElectronTimerAPI | null => {
    return window.electronAPI?.timer ?? null
  }, [])

  // 開始計時
  const start = useCallback(async (duration: number, mode: TimerMode = 'countdown'): Promise<void> => {
    const api = getTimerAPI()
    if (api) {
      const data = await api.start(duration, mode)
      setTimerData(data)
    }
  }, [getTimerAPI])

  // 暫停計時
  const pause = useCallback(async (): Promise<void> => {
    const api = getTimerAPI()
    if (api) {
      const data = await api.pause()
      setTimerData(data)
    }
  }, [getTimerAPI])

  // 繼續計時
  const resume = useCallback(async (): Promise<void> => {
    const api = getTimerAPI()
    if (api) {
      const data = await api.resume()
      setTimerData(data)
    }
  }, [getTimerAPI])

  // 停止計時
  const stop = useCallback(async (): Promise<void> => {
    const api = getTimerAPI()
    if (api) {
      const data = await api.stop()
      setTimerData(data)
    }
  }, [getTimerAPI])

  // 重置計時
  const reset = useCallback(async (): Promise<void> => {
    const api = getTimerAPI()
    if (api) {
      const data = await api.reset()
      setTimerData(data)
    }
  }, [getTimerAPI])

  // 訂閱計時完成事件
  const subscribeComplete = useCallback(
    (callback: (data: { duration: number; actualElapsed: number; mode: TimerMode }) => void): (() => void) => {
      const api = getTimerAPI()
      if (!api) return () => {}
      return api.onComplete(callback)
    },
    [getTimerAPI]
  )

  // 訂閱 IPC 事件
  useEffect(() => {
    const api = getTimerAPI()
    if (!api) return

    // 訂閱 tick 事件
    const cleanupTick = api.onTick((data) => {
      setTimerData(data)
    })

    // 訂閱狀態變更事件
    const cleanupStateChange = api.onStateChange(() => {
      // 狀態已由 tick 事件更新，此處可用於額外處理
    })

    // 訂閱完成事件
    const cleanupComplete = api.onComplete(() => {
      // 完成事件由 tick 事件處理 state 變更，此處可用於額外處理（如通知）
    })

    return () => {
      cleanupTick()
      cleanupStateChange()
      cleanupComplete()
    }
  }, [getTimerAPI])

  return {
    state: timerData.state,
    mode: timerData.mode,
    duration: timerData.duration,
    remaining: timerData.remaining,
    elapsed: timerData.elapsed,
    isOvertime: timerData.isOvertime,
    displayTime: timerData.displayTime,
    start,
    pause,
    resume,
    stop,
    reset,
    subscribeComplete,
  }
}
