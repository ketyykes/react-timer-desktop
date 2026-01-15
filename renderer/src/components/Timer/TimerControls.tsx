import { Button } from '@/components/ui/button'
import type { TimerState } from '../../../../shared/types'

export interface TimerControlsProps {
  /** 目前計時器狀態 */
  state: TimerState
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
 * 只在計時中 (running/paused/overtime) 顯示控制按鈕
 */
export function TimerControls({
  state,
  onPause,
  onResume,
  onStop,
}: TimerControlsProps) {
  return (
    <div className="flex gap-3 justify-center">
      {state === 'running' && (
        <>
          <Button variant="outline" onClick={onPause}>暫停</Button>
          <Button variant="destructive" onClick={onStop}>停止</Button>
        </>
      )}

      {state === 'paused' && (
        <>
          <Button onClick={onResume}>繼續</Button>
          <Button variant="destructive" onClick={onStop}>停止</Button>
        </>
      )}

      {state === 'overtime' && (
        <Button variant="destructive" onClick={onStop}>停止</Button>
      )}
    </div>
  )
}
