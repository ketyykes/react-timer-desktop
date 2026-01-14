import { Button } from '@/components/ui/button'
import type { TimerState } from '../../../../shared/types'

export interface TimerControlsProps {
  /** 目前計時器狀態 */
  state: TimerState
  /** 開始計時 */
  onStart: () => void
  /** 暫停計時 */
  onPause: () => void
  /** 繼續計時 */
  onResume: () => void
  /** 停止計時 */
  onStop: () => void
  /** 重置計時 */
  onReset: () => void
}

/**
 * 計時器控制按鈕元件
 */
export function TimerControls({
  state,
  onStart,
  onPause,
  onResume,
  onStop,
}: TimerControlsProps) {
  return (
    <div className="flex gap-2">
      {state === 'idle' && (
        <Button onClick={onStart}>開始</Button>
      )}

      {state === 'running' && (
        <>
          <Button variant="secondary" onClick={onPause}>
            暫停
          </Button>
          <Button variant="destructive" onClick={onStop}>
            停止
          </Button>
        </>
      )}

      {state === 'paused' && (
        <>
          <Button onClick={onResume}>繼續</Button>
          <Button variant="destructive" onClick={onStop}>
            停止
          </Button>
        </>
      )}

      {state === 'overtime' && (
        <Button variant="destructive" onClick={onStop}>
          停止
        </Button>
      )}
    </div>
  )
}
