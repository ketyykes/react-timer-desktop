import { useCallback } from 'react'
import { parseTime } from '../../../../shared/types'

export interface TimeInputProps {
  /** 輸入值 */
  value: string
  /** 值變更時的回調 */
  onChange: (value: string) => void
  /** 送出時間（毫秒） */
  onSubmit: (ms: number) => void
  /** 是否禁用 */
  disabled: boolean
  /** 錯誤訊息 */
  error?: string | null
}

/**
 * 時間輸入元件
 */
export function TimeInput({ value, onChange, onSubmit, disabled, error }: TimeInputProps) {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }, [onChange])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== 'Enter') return

      const trimmed = value.trim()
      if (!trimmed) return

      try {
        const ms = parseTime(trimmed)
        onSubmit(ms)
      } catch {
        // 錯誤由父元件處理
      }
    },
    [value, onSubmit]
  )

  return (
    <div className="flex flex-col gap-2 w-full">
      <input
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="輸入時間 (例: 5:00)"
        className="w-full px-4 py-2 border border-gray-300 rounded-md text-center font-mono text-base bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      />
      <p className="text-xs text-gray-500 text-center">輸入時間後按「開始」或 Enter</p>
      {error && (
        <span className="text-sm text-red-500 text-center">{error}</span>
      )}
    </div>
  )
}
