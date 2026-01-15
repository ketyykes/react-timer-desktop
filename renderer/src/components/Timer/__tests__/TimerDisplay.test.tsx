import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
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
})
