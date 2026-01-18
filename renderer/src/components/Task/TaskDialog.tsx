import { useState, useCallback, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { formatTime } from '../../../../shared/types'

export interface TaskDialogProps {
  /** 是否開啟對話框 */
  open: boolean
  /** 設定的時間（毫秒） */
  duration: number
  /** 實際計時時間（毫秒） */
  actualTime: number
  /** 預填的任務名稱 */
  defaultName?: string
  /** 確認儲存 */
  onConfirm: (name: string) => void
  /** 取消/跳過 */
  onCancel: () => void
}

/**
 * 任務輸入對話框
 * 停止計時器後顯示，讓使用者輸入任務名稱
 */
export function TaskDialog({
  open,
  duration,
  actualTime,
  defaultName,
  onConfirm,
  onCancel,
}: TaskDialogProps) {
  const [taskName, setTaskName] = useState(defaultName ?? '')

  useEffect(() => {
    if (open) {
      setTaskName(defaultName ?? '')
    }
  }, [open, defaultName])

  const handleConfirm = useCallback(() => {
    onConfirm(taskName)
    setTaskName('')
  }, [onConfirm, taskName])

  const handleCancel = useCallback(() => {
    onCancel()
    setTaskName('')
  }, [onCancel])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handleConfirm()
      } else if (e.key === 'Escape') {
        handleCancel()
      }
    },
    [handleConfirm, handleCancel]
  )

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleCancel()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>記錄任務</DialogTitle>
          <DialogDescription className="space-y-1">
            <span className="block">設定時間：{formatTime(duration)}</span>
            <span className="block">實際時間：{formatTime(actualTime)}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Input
            placeholder="輸入任務名稱（選填）"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCancel}>
            跳過
          </Button>
          <Button onClick={handleConfirm}>儲存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
