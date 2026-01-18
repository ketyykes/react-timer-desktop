import { Input } from '@/components/ui/input'

export interface TaskDescriptionInputProps {
  /** 輸入值 */
  value: string
  /** 值變更時的回調 */
  onChange: (value: string) => void
  /** 是否禁用 */
  disabled: boolean
}

/**
 * 任務描述輸入元件
 * 用於計時前輸入任務目標（選填）
 */
export function TaskDescriptionInput({
  value,
  onChange,
  disabled,
}: TaskDescriptionInputProps) {
  return (
    <Input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      placeholder="這次要做什麼？（選填）"
      className="text-center bg-white/10 border-white/20 text-white placeholder:text-white/50"
    />
  )
}
