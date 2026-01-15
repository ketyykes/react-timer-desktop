import { Button } from '@/components/ui/button'

export interface PresetButtonsProps {
  /** 選擇預設時間（毫秒） */
  onSelect: (ms: number) => void
  /** 是否禁用 */
  disabled: boolean
}

const PRESETS = [
  { label: '5 分鐘', ms: 5 * 60 * 1000 },
  { label: '15 分鐘', ms: 15 * 60 * 1000 },
  { label: '25 分鐘', ms: 25 * 60 * 1000 },
  { label: '30 分鐘', ms: 30 * 60 * 1000 },
] as const

/**
 * 預設時間按鈕元件
 */
export function PresetButtons({ onSelect, disabled }: PresetButtonsProps) {
  return (
    <div className="grid grid-cols-4 gap-2 w-full">
      {PRESETS.map((preset) => (
        <Button
          key={preset.ms}
          variant="secondary"
          size="sm"
          disabled={disabled}
          onClick={() => onSelect(preset.ms)}
          className="text-xs font-medium"
        >
          {preset.label}
        </Button>
      ))}
    </div>
  )
}
