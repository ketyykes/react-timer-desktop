import { Button } from '@/components/ui/button'

export interface PresetButtonsProps {
  /** 選擇預設時間（毫秒） */
  onSelect: (ms: number) => void
  /** 是否禁用 */
  disabled: boolean
}

const PRESETS = [
  { label: '5 分鐘', ms: 5 * 60 * 1000 },
  { label: '10 分鐘', ms: 10 * 60 * 1000 },
  { label: '25 分鐘', ms: 25 * 60 * 1000 },
  { label: '45 分鐘', ms: 45 * 60 * 1000 },
] as const

/**
 * 預設時間按鈕元件
 */
export function PresetButtons({ onSelect, disabled }: PresetButtonsProps) {
  return (
    <div className="grid grid-cols-2 gap-2 w-full">
      {PRESETS.map((preset) => (
        <Button
          key={preset.ms}
          variant="outline"
          size="default"
          disabled={disabled}
          onClick={() => onSelect(preset.ms)}
        >
          {preset.label}
        </Button>
      ))}
    </div>
  )
}
