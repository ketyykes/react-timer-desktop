import type { TimerMode } from '../../../../shared/types'
import { Button } from '@/components/ui/button'
import { ArrowDownToLine, ArrowUpFromLine } from 'lucide-react'

interface ModeSelectorProps {
  /** 當前選中的模式 */
  mode: TimerMode
  /** 模式變更回調 */
  onChange: (mode: TimerMode) => void
  /** 是否禁用 */
  disabled?: boolean
}

/**
 * 計時模式選擇器
 * Toggle 按鈕切換倒數 (countdown) 和正數 (countup) 模式
 */
export function ModeSelector({ mode, onChange, disabled = false }: ModeSelectorProps) {
  const handleToggle = () => {
    if (!disabled) {
      onChange(mode === 'countdown' ? 'countup' : 'countdown')
    }
  }

  const isCountdown = mode === 'countdown'
  const Icon = isCountdown ? ArrowDownToLine : ArrowUpFromLine
  const label = isCountdown ? '倒數' : '正數'

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggle}
      disabled={disabled}
      data-mode={mode}
      className="gap-1.5"
    >
      <Icon className="h-4 w-4" />
      {label}
    </Button>
  )
}
