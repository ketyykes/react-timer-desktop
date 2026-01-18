import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TimerDisplay } from '../TimerDisplay'

describe('TimerDisplay', () => {
  describe('時間顯示', () => {
    it('應顯示格式化的剩餘時間', () => {
      render(<TimerDisplay displayTime={65000} isOvertime={false} mode="countdown" />)
      expect(screen.getByText('01:05')).toBeInTheDocument()
    })

    it('應正確顯示零秒', () => {
      render(<TimerDisplay displayTime={0} isOvertime={false} mode="countdown" />)
      expect(screen.getByText('00:00')).toBeInTheDocument()
    })

    it('應正確顯示大於 10 分鐘的時間', () => {
      render(<TimerDisplay displayTime={600000} isOvertime={false} mode="countdown" />)
      expect(screen.getByText('10:00')).toBeInTheDocument()
    })
  })

  describe('倒數模式超時顯示', () => {
    it('倒數模式超時時應顯示負數格式 -MM:SS', () => {
      render(<TimerDisplay displayTime={-5000} isOvertime={true} mode="countdown" />)
      expect(screen.getByText('-00:05')).toBeInTheDocument()
    })

    it('超時時應套用 overtime 樣式', () => {
      render(<TimerDisplay displayTime={-5000} isOvertime={true} mode="countdown" />)
      const display = screen.getByTestId('timer-display')
      expect(display).toHaveClass('text-red-500')
    })

    it('非超時時不應套用 overtime 樣式', () => {
      render(<TimerDisplay displayTime={5000} isOvertime={false} mode="countdown" />)
      const display = screen.getByTestId('timer-display')
      expect(display).not.toHaveClass('text-red-500')
    })
  })

  describe('正數模式顯示', () => {
    it('正數模式應顯示已經過時間', () => {
      render(<TimerDisplay displayTime={65000} isOvertime={false} mode="countup" />)
      expect(screen.getByText('01:05')).toBeInTheDocument()
    })

    it('正數模式超時時應顯示 +MM:SS 格式', () => {
      render(<TimerDisplay displayTime={65000} isOvertime={true} mode="countup" />)
      expect(screen.getByText('+01:05')).toBeInTheDocument()
    })

    it('正數模式超時時應套用 overtime 樣式', () => {
      render(<TimerDisplay displayTime={65000} isOvertime={true} mode="countup" />)
      const display = screen.getByTestId('timer-display')
      expect(display).toHaveClass('text-red-500')
    })
  })

  describe('編輯模式', () => {
    const editableProps = {
      displayTime: 0,
      isOvertime: false,
      mode: 'countdown' as const,
      editable: true,
      onTimeChange: vi.fn(),
    }

    it('editable 為 true 時點擊應進入編輯模式', async () => {
      const user = userEvent.setup()
      render(<TimerDisplay {...editableProps} />)

      await user.click(screen.getByTestId('timer-display'))
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('編輯模式下輸入時間並按 Enter 應呼叫 onTimeChange', async () => {
      const user = userEvent.setup()
      const onTimeChange = vi.fn()
      render(<TimerDisplay {...editableProps} onTimeChange={onTimeChange} />)

      await user.click(screen.getByTestId('timer-display'))
      const input = screen.getByRole('textbox')
      await user.clear(input)
      await user.type(input, '5:00{Enter}')

      expect(onTimeChange).toHaveBeenCalledWith(300000) // 5 分鐘
    })

    it('編輯模式下按 Escape 應取消編輯', async () => {
      const user = userEvent.setup()
      render(<TimerDisplay {...editableProps} />)

      await user.click(screen.getByTestId('timer-display'))
      await user.keyboard('{Escape}')

      expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    })

    it('editable 為 false 時點擊不應進入編輯模式', async () => {
      const user = userEvent.setup()
      render(<TimerDisplay {...editableProps} editable={false} />)

      await user.click(screen.getByTestId('timer-display'))
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    })
  })
})
