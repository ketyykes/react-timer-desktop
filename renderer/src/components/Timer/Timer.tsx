import { useCallback, useState } from 'react'
import { useTimer } from '@/hooks/useTimer'
import { TimerDisplay } from './TimerDisplay'
import { TimerControls } from './TimerControls'
import { TimeInput } from './TimeInput'
import { PresetButtons } from './PresetButtons'

/**
 * 計時器主元件
 * 整合時間顯示、控制按鈕、時間輸入和預設時間選擇
 */
export function Timer() {
  const {
    state,
    remaining,
    isOvertime,
    start,
    pause,
    resume,
    stop,
    reset,
  } = useTimer()

  // 防止按鈕連點
  const [isStarting, setIsStarting] = useState(false)

  const isIdle = state === 'idle'
  const isActive = state !== 'idle'

  const handleTimeSubmit = useCallback(async (ms: number) => {
    if (isStarting) return
    setIsStarting(true)
    try {
      await start(ms)
    } finally {
      setIsStarting(false)
    }
  }, [start, isStarting])

  const handlePresetSelect = useCallback(async (ms: number) => {
    if (isStarting) return
    setIsStarting(true)
    try {
      await start(ms)
    } finally {
      setIsStarting(false)
    }
  }, [start, isStarting])

  // 開始按鈕不需要額外邏輯，由 TimeInput 或 PresetButtons 直接啟動

  return (
    <div className="flex flex-col items-center justify-center gap-6 text-center">
      <TimerDisplay remaining={remaining} isOvertime={isOvertime} />

      {isIdle && (
        <div className="flex flex-col items-center gap-4 w-full">
          <TimeInput onSubmit={handleTimeSubmit} disabled={isActive || isStarting} />
          <PresetButtons onSelect={handlePresetSelect} disabled={isActive || isStarting} />
        </div>
      )}

      <TimerControls
        state={state}
        onStart={() => {}}
        onPause={pause}
        onResume={resume}
        onStop={stop}
        onReset={reset}
      />
    </div>
  )
}
