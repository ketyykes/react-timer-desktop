/**
 * 計時器狀態
 */
export type TimerState = 'idle' | 'running' | 'paused' | 'overtime'

/**
 * 計時器資料
 */
export interface TimerData {
  /** 計時器狀態 */
  state: TimerState
  /** 設定的持續時間（毫秒） */
  duration: number
  /** 剩餘時間（毫秒），可為負數（overtime） */
  remaining: number
  /** 已經過時間（毫秒） */
  elapsed: number
  /** 是否超時 */
  isOvertime: boolean
}

/**
 * 計時器 Tick 事件
 */
export interface TimerTickEvent {
  type: 'tick'
  data: TimerData
}

/**
 * 計時器狀態變更事件
 */
export interface TimerStateChangeEvent {
  type: 'stateChange'
  data: {
    previousState: TimerState
    currentState: TimerState
  }
}

/**
 * 計時器完成事件（時間到達）
 */
export interface TimerCompleteEvent {
  type: 'complete'
  data: {
    duration: number
    actualElapsed: number
  }
}

/**
 * 計時器事件聯合型別
 */
export type TimerEvent = TimerTickEvent | TimerStateChangeEvent | TimerCompleteEvent

/**
 * 任務記錄
 */
export interface TaskRecord {
  /** 唯一識別碼 */
  id: string
  /** 任務名稱 */
  name: string
  /** 設定的時間（毫秒） */
  duration: number
  /** 實際計時時間（毫秒） */
  actualTime: number
  /** 建立時間 (Unix timestamp) */
  createdAt: number
}

/**
 * IPC Channel 名稱
 */
export const IPC_CHANNELS = {
  // 渲染程序 → 主程序（命令）
  TIMER_START: 'timer:start',
  TIMER_PAUSE: 'timer:pause',
  TIMER_RESUME: 'timer:resume',
  TIMER_STOP: 'timer:stop',
  TIMER_RESET: 'timer:reset',

  // 主程序 → 渲染程序（事件）
  TIMER_TICK: 'timer:tick',
  TIMER_STATE_CHANGE: 'timer:stateChange',
  TIMER_COMPLETE: 'timer:complete',

  // 任務記錄
  TASK_SAVE: 'task:save',
  TASK_GET_ALL: 'task:getAll',
  TASK_DELETE: 'task:delete',
} as const

/**
 * 格式化時間為 MM:SS 格式
 */
export function formatTime(ms: number): string {
  const isNegative = ms < 0
  const absMs = Math.abs(ms)
  const totalSeconds = Math.floor(absMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  const formatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  return isNegative ? `-${formatted}` : formatted
}

/**
 * 解析時間字串為毫秒
 * 支援格式：MM:SS, M:SS, SS, 純數字（秒）
 */
export function parseTime(timeStr: string): number {
  const trimmed = timeStr.trim()

  // 純數字（視為秒）
  if (/^\d+$/.test(trimmed)) {
    return parseInt(trimmed, 10) * 1000
  }

  // MM:SS 格式
  const match = trimmed.match(/^(\d+):(\d{2})$/)
  if (match) {
    const minutes = parseInt(match[1], 10)
    const seconds = parseInt(match[2], 10)
    return (minutes * 60 + seconds) * 1000
  }

  throw new Error(`Invalid time format: ${timeStr}`)
}
