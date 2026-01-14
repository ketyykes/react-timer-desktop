import { useState, useCallback } from 'react'
import { parseTime } from '../../../../shared/types'

export interface TimeInputProps {
  /** 送出時間（毫秒） */
  onSubmit: (ms: number) => void
  /** 是否禁用 */
  disabled: boolean
}

/**
 * 時間輸入元件
 */
export function TimeInput({ onSubmit, disabled }: TimeInputProps) {
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value)
    setError(null)
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== 'Enter') return

      const trimmed = value.trim()
      if (!trimmed) return

      try {
        const ms = parseTime(trimmed)
        onSubmit(ms)
        setValue('')
        setError(null)
      } catch {
        setError('無效的時間格式')
      }
    },
    [value, onSubmit]
  )

  return (
    <div className="flex flex-col gap-1">
      <input
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="輸入時間 (例: 05:00 或 300)"
        className="px-3 py-2 border rounded-md text-center font-mono disabled:opacity-50 disabled:cursor-not-allowed"
      />
      {error && (
        <span className="text-sm text-destructive">{error}</span>
      )}
    </div>
  )
}
