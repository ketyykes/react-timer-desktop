import { useCallback, useState } from 'react'
import { useTimer } from '@/hooks/useTimer'
import { type TimerMode } from '../../../../shared/types'
import { TimerDisplay } from './TimerDisplay'
import { TimerControls } from './TimerControls'
import { PresetButtons } from './PresetButtons'
import { TaskDescriptionInput } from './TaskDescriptionInput'
import { Button } from '@/components/ui/button'
import { Timer as TimerIcon, ArrowUp } from 'lucide-react'

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

  // 用戶透過 TimerDisplay 設定的待開始時間（毫秒）
  const [pendingTime, setPendingTime] = useState<number>(0)
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
      setPendingTime(0)
    } finally {
      setIsStarting(false)
    }
  }, [start, isStarting, selectedMode])

  // 處理 TimerDisplay 時間變更（用戶輸入）
  const handleTimeChange = useCallback((ms: number) => {
    setPendingTime(ms)
  }, [])

  // 處理預設按鈕選擇 - 直接開始計時
  const handlePresetSelect = useCallback(async (ms: number) => {
    await startTimer(ms)
  }, [startTimer])

  // 處理開始按鈕點擊（使用 pendingTime）
  const handleStart = useCallback(async () => {
    if (pendingTime > 0) {
      await startTimer(pendingTime)
    }
  }, [pendingTime, startTimer])

  // 切換計時模式
  const toggleMode = useCallback(() => {
    setSelectedMode((prev) => (prev === 'countdown' ? 'countup' : 'countdown'))
  }, [])

  // 顯示的模式：計時中用實際模式，idle 時用選擇的模式
  const displayMode = isIdle ? selectedMode : mode

  // 顯示時間：idle 時顯示 pendingTime，否則顯示 displayTime
  const timeToDisplay = isIdle ? pendingTime : displayTime

  return (
    <div className="flex flex-col items-center justify-center gap-4 text-center">
      <TimerDisplay
        displayTime={timeToDisplay}
        isOvertime={isOvertime}
        mode={displayMode}
        editable={isIdle}
        onTimeChange={handleTimeChange}
      />

      {isIdle && (
        <div className="flex flex-col items-center gap-3 w-full">
          <TaskDescriptionInput
            value={taskDescription}
            onChange={onTaskDescriptionChange}
            disabled={isActive || isStarting}
          />
          <PresetButtons onSelect={handlePresetSelect} disabled={isActive || isStarting} />
          <div className="flex gap-2 items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleMode}
              disabled={isActive || isStarting}
              className="flex items-center gap-1"
            >
              {selectedMode === 'countdown' ? (
                <>
                  <TimerIcon className="h-4 w-4" />
                  倒數
                </>
              ) : (
                <>
                  <ArrowUp className="h-4 w-4" />
                  正數
                </>
              )}
            </Button>
            {pendingTime > 0 && (
              <Button onClick={handleStart} disabled={isStarting}>
                開始
              </Button>
            )}
          </div>
        </div>
      )}

      {!isIdle && (
        <div className="flex flex-col items-center gap-3">
          {taskDescription && (
            <p className="text-sm text-gray-600">「{taskDescription}」</p>
          )}
          <TimerControls
            state={state}
            onPause={pause}
            onResume={resume}
            onStop={handleStop}
            onReset={reset}
          />
        </div>
      )}
    </div>
  )
}
