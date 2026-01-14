import { cn } from '@/lib/utils'
import { formatTime } from '../../../../shared/types'

export interface TimerDisplayProps {
  /** 剩餘時間（毫秒） */
  remaining: number
  /** 是否超時 */
  isOvertime: boolean
}

/**
 * 計時器時間顯示元件
 */
export function TimerDisplay({ remaining, isOvertime }: TimerDisplayProps) {
  return (
    <div
      data-testid="timer-display"
      className={cn(
        'text-6xl font-mono font-bold tabular-nums',
        isOvertime && 'text-destructive'
      )}
    >
      {formatTime(remaining)}
    </div>
  )
}
