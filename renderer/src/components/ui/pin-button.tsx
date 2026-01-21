import { Pin, PinOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PinButtonProps {
  isPinned: boolean
  onClick: () => void
  className?: string
}

export function PinButton({ isPinned, onClick, className }: PinButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'p-1.5 rounded-md transition-colors',
        'hover:bg-white/10 active:bg-white/20',
        'text-white/60 hover:text-white/90',
        'focus:outline-none focus:ring-2 focus:ring-white/20',
        className
      )}
      aria-pressed={isPinned}
      title={isPinned ? '取消釘選' : '釘選視窗'}
    >
      {isPinned ? (
        <Pin className="w-4 h-4 fill-current" />
      ) : (
        <PinOff className="w-4 h-4" />
      )}
    </button>
  )
}
