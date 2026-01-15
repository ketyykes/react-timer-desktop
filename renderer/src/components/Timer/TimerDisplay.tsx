import { cn } from '@/lib/utils'
import { formatTime, type TimerMode } from '../../../../shared/types'

export interface TimerDisplayProps {
  /** 顯示用時間（毫秒） */
  displayTime: number
  /** 是否超時 */
  isOvertime: boolean
  /** 計時模式 */
  mode: TimerMode
}

/**
 * 計時器時間顯示元件
 */
export function TimerDisplay({ displayTime, isOvertime, mode }: TimerDisplayProps) {
  // 正數模式超時時顯示 + 前綴
  const prefix = mode === 'countup' && isOvertime ? '+' : ''
  // 倒數模式用 ceil（確保剩餘時間不低估），正數模式用 floor（確保經過時間不高估）
  const useCeil = mode === 'countdown'
  const formattedTime = formatTime(displayTime, useCeil)

  return (
    <div
      data-testid="timer-display"
      className={cn(
        'text-5xl font-mono font-bold tabular-nums',
        'text-gray-900',
        isOvertime && 'text-red-500'
      )}
    >
      {prefix}{formattedTime}
    </div>
  )
}
