/**
 * 計時器狀態
 */
export type TimerState = 'idle' | 'running' | 'paused' | 'overtime'

/**
 * 計時模式
 * - countdown: 倒數模式（從設定時間倒數到 0）
 * - countup: 正數模式（從 0 開始計時到設定時間）
 */
export type TimerMode = 'countdown' | 'countup'

/**
 * 計時器資料
 */
export interface TimerData {
  /** 計時器狀態 */
  state: TimerState
  /** 計時模式 */
  mode: TimerMode
  /** 設定的持續時間（毫秒） */
  duration: number
  /** 剩餘時間（毫秒），可為負數（overtime） */
  remaining: number
  /** 已經過時間（毫秒） */
  elapsed: number
  /** 是否超時 */
  isOvertime: boolean
  /** 顯示用時間（毫秒），根據模式計算 */
  displayTime: number
}

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
  TIMER_STOP_FROM_TRAY: 'timer:stopFromTray',

  // 任務記錄
  TASK_SAVE: 'task:save',
  TASK_GET_ALL: 'task:getAll',
  TASK_DELETE: 'task:delete',
  TASK_UPDATE: 'task:update',

  // 歷史記錄視窗
  HISTORY_OPEN: 'history:open',
} as const

/**
 * 格式化時間為 MM:SS 格式
 *
 * @param ms 毫秒數
 * @param useCeil 是否使用 ceil（預設 true，適合倒數模式；正數模式應傳 false）
 *
 * 倒數模式（useCeil=true）：使用 Math.ceil 確保剩餘時間不會被低估
 *   例如：298993ms 應顯示 04:59 而非 04:58
 * 正數模式（useCeil=false）：使用 Math.floor 確保顯示時間不會超過實際經過時間
 *   例如：1001ms 應顯示 00:01 而非 00:02
 */
export function formatTime(ms: number, useCeil: boolean = true): string {
  // 防禦性處理：undefined 或 NaN 視為 0
  if (ms === undefined || ms === null || Number.isNaN(ms)) {
    ms = 0
  }
  const isNegative = ms < 0
  const absMs = Math.abs(ms)
  // 根據模式選擇 ceil 或 floor
  const totalSeconds = useCeil ? Math.ceil(absMs / 1000) : Math.floor(absMs / 1000)
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
