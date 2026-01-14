import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TimerDisplay } from '../TimerDisplay'

describe('TimerDisplay', () => {
  describe('時間顯示', () => {
    it('應顯示格式化的剩餘時間', () => {
      render(<TimerDisplay remaining={65000} isOvertime={false} />)
      expect(screen.getByText('01:05')).toBeInTheDocument()
    })

    it('應正確顯示零秒', () => {
      render(<TimerDisplay remaining={0} isOvertime={false} />)
      expect(screen.getByText('00:00')).toBeInTheDocument()
    })

    it('應正確顯示大於 10 分鐘的時間', () => {
      render(<TimerDisplay remaining={600000} isOvertime={false} />)
      expect(screen.getByText('10:00')).toBeInTheDocument()
    })
  })

  describe('超時顯示', () => {
    it('超時時應顯示負數時間', () => {
      render(<TimerDisplay remaining={-5000} isOvertime={true} />)
      expect(screen.getByText('-00:05')).toBeInTheDocument()
    })

    it('超時時應套用 overtime 樣式', () => {
      render(<TimerDisplay remaining={-5000} isOvertime={true} />)
      const display = screen.getByTestId('timer-display')
      expect(display).toHaveClass('text-destructive')
    })

    it('非超時時不應套用 overtime 樣式', () => {
      render(<TimerDisplay remaining={5000} isOvertime={false} />)
      const display = screen.getByTestId('timer-display')
      expect(display).not.toHaveClass('text-destructive')
    })
  })
})
