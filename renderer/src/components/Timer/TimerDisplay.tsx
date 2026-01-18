import { useState, useCallback, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { formatTime, parseTime, type TimerMode } from '../../../../shared/types'

export interface TimerDisplayProps {
  /** 顯示用時間（毫秒） */
  displayTime: number
  /** 是否超時 */
  isOvertime: boolean
  /** 計時模式 */
  mode: TimerMode
  /** 是否可編輯（idle 狀態時為 true） */
  editable?: boolean
  /** 時間變更回調（毫秒） */
  onTimeChange?: (ms: number) => void
}

/**
 * 計時器時間顯示元件
 */
export function TimerDisplay({
  displayTime,
  isOvertime,
  mode,
  editable = false,
  onTimeChange,
}: TimerDisplayProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // 正數模式超時時顯示 + 前綴
  const prefix = mode === 'countup' && isOvertime ? '+' : ''
  // 倒數模式用 ceil（確保剩餘時間不低估），正數模式用 floor（確保經過時間不高估）
  const useCeil = mode === 'countdown'
  const formattedTime = formatTime(displayTime, useCeil)

  const handleClick = useCallback(() => {
    if (editable && !isEditing) {
      setIsEditing(true)
      setInputValue('')
    }
  }, [editable, isEditing])

  const handleSubmit = useCallback(() => {
    const trimmed = inputValue.trim()
    if (trimmed && onTimeChange) {
      try {
        const ms = parseTime(trimmed)
        onTimeChange(ms)
      } catch {
        // 無效格式，忽略
      }
    }
    setIsEditing(false)
  }, [inputValue, onTimeChange])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSubmit()
      } else if (e.key === 'Escape') {
        setIsEditing(false)
      }
    },
    [handleSubmit]
  )

  const handleBlur = useCallback(() => {
    setIsEditing(false)
  }, [])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isEditing])

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder="0:00"
        className={cn(
          'text-5xl font-mono font-bold tabular-nums text-center',
          'bg-transparent border-b-2 border-blue-500 outline-none',
          'w-32'
        )}
      />
    )
  }

  return (
    <div
      data-testid="timer-display"
      onClick={handleClick}
      className={cn(
        'text-5xl font-mono font-bold tabular-nums',
        'text-gray-900',
        isOvertime && 'text-red-500',
        editable && 'cursor-pointer hover:text-blue-600 transition-colors'
      )}
    >
      {prefix}{formattedTime}
    </div>
  )
}
