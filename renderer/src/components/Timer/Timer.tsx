import { useCallback, useState } from 'react'
import { useTimer } from '@/hooks/useTimer'
import { parseTime } from '../../../../shared/types'
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

  // 時間輸入狀態
  const [inputValue, setInputValue] = useState('')
  const [inputError, setInputError] = useState<string | null>(null)
  // 防止按鈕連點
  const [isStarting, setIsStarting] = useState(false)

  const isIdle = state === 'idle'
  const isActive = state !== 'idle'

  // 啟動計時器的共用邏輯
  const startTimer = useCallback(async (ms: number) => {
    if (isStarting) return
    setIsStarting(true)
    try {
      await start(ms)
      setInputValue('')
      setInputError(null)
    } finally {
      setIsStarting(false)
    }
  }, [start, isStarting])

  // 處理時間輸入變更
  const handleInputChange = useCallback((value: string) => {
    setInputValue(value)
    setInputError(null)
  }, [])

  // 處理時間輸入送出（Enter 鍵）
  const handleTimeSubmit = useCallback(async (ms: number) => {
    await startTimer(ms)
  }, [startTimer])

  // 處理預設按鈕選擇
  const handlePresetSelect = useCallback(async (ms: number) => {
    await startTimer(ms)
  }, [startTimer])

  // 處理開始按鈕點擊
  const handleStart = useCallback(async () => {
    const trimmed = inputValue.trim()
    if (!trimmed) {
      setInputError('請輸入時間')
      return
    }

    try {
      const ms = parseTime(trimmed)
      await startTimer(ms)
    } catch {
      setInputError('無效的時間格式')
    }
  }, [inputValue, startTimer])

  return (
    <div className="flex flex-col items-center justify-center gap-6 text-center">
      <TimerDisplay remaining={remaining} isOvertime={isOvertime} />

      {isIdle && (
        <div className="flex flex-col items-center gap-4 w-full">
          <TimeInput
            value={inputValue}
            onChange={handleInputChange}
            onSubmit={handleTimeSubmit}
            disabled={isActive || isStarting}
            error={inputError}
          />
          <PresetButtons onSelect={handlePresetSelect} disabled={isActive || isStarting} />
        </div>
      )}

      <TimerControls
        state={state}
        onStart={handleStart}
        onPause={pause}
        onResume={resume}
        onStop={stop}
        onReset={reset}
      />
    </div>
  )
}
