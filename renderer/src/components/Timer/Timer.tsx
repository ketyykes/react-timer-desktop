import { useCallback, useState } from 'react'
import { useTimer } from '@/hooks/useTimer'
import { parseTime, type TimerMode } from '../../../../shared/types'
import { TimerDisplay } from './TimerDisplay'
import { TimerControls } from './TimerControls'
import { TimeInput } from './TimeInput'
import { PresetButtons } from './PresetButtons'
import { ModeSelector } from './ModeSelector'
import { TaskDescriptionInput } from './TaskDescriptionInput'
import { Button } from '@/components/ui/button'

/**
 * Timer 元件的 props 介面
 */
export interface TimerProps {
  /** 任務描述 */
  taskDescription: string
  /** 任務描述變更回調 */
  onTaskDescriptionChange: (value: string) => void
  /** 停止計時回調（用戶按下停止按鈕時觸發） */
  onStop: (data: { duration: number; actualElapsed: number; mode: TimerMode }) => void
}

/**
 * 計時器主元件
 * 整合時間顯示、控制按鈕、時間輸入和預設時間選擇
 */
export function Timer({ taskDescription, onTaskDescriptionChange, onStop }: TimerProps) {
  const {
    state,
    mode,
    duration,
    elapsed,
    displayTime,
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
  // 選擇的計時模式
  const [selectedMode, setSelectedMode] = useState<TimerMode>('countdown')

  const isIdle = state === 'idle'
  const isActive = state !== 'idle'

  // 處理停止按鈕點擊
  const handleStop = useCallback(async () => {
    // 先取得當前計時資料
    const stopData = {
      duration,
      actualElapsed: elapsed,
      mode,
    }
    // 停止計時器
    await stop()
    // 通知父元件
    onStop(stopData)
  }, [duration, elapsed, mode, stop, onStop])

  // 啟動計時器的共用邏輯
  const startTimer = useCallback(async (ms: number) => {
    if (isStarting) return
    setIsStarting(true)
    try {
      await start(ms, selectedMode)
      setInputValue('')
      setInputError(null)
    } finally {
      setIsStarting(false)
    }
  }, [start, isStarting, selectedMode])

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

  // 顯示的模式：計時中用實際模式，idle 時用選擇的模式
  const displayMode = isIdle ? selectedMode : mode

  return (
    <div className="flex flex-col items-center justify-center gap-6 text-center">
      <TimerDisplay displayTime={displayTime} isOvertime={isOvertime} mode={displayMode} />

      {isIdle && (
        <div className="flex flex-col items-center gap-4 w-full">
          <TimeInput
            value={inputValue}
            onChange={handleInputChange}
            onSubmit={handleTimeSubmit}
            disabled={isActive || isStarting}
            error={inputError}
          />
          <TaskDescriptionInput
            value={taskDescription}
            onChange={onTaskDescriptionChange}
            disabled={isActive || isStarting}
          />
          <PresetButtons onSelect={handlePresetSelect} disabled={isActive || isStarting} />
          <div className="flex gap-2 items-center">
            <ModeSelector
              mode={selectedMode}
              onChange={setSelectedMode}
              disabled={isActive || isStarting}
            />
            <Button onClick={handleStart} disabled={isStarting}>
              開始
            </Button>
          </div>
        </div>
      )}

      {!isIdle && (
        <TimerControls
          state={state}
          onPause={pause}
          onResume={resume}
          onStop={handleStop}
          onReset={reset}
        />
      )}
    </div>
  )
}
