import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ModeSelector } from '../ModeSelector'

describe('ModeSelector', () => {
  describe('渲染', () => {
    it('countdown 模式應顯示倒數文字和圖示', () => {
      render(<ModeSelector mode="countdown" onChange={vi.fn()} />)

      const button = screen.getByRole('button', { name: /倒數/i })
      expect(button).toBeInTheDocument()
      expect(button).toHaveAttribute('data-mode', 'countdown')
    })

    it('countup 模式應顯示正數文字和圖示', () => {
      render(<ModeSelector mode="countup" onChange={vi.fn()} />)

      const button = screen.getByRole('button', { name: /正數/i })
      expect(button).toBeInTheDocument()
      expect(button).toHaveAttribute('data-mode', 'countup')
    })
  })

  describe('互動', () => {
    it('點擊 toggle 按鈕應從 countdown 切換到 countup', () => {
      const mockOnChange = vi.fn()
      render(<ModeSelector mode="countdown" onChange={mockOnChange} />)

      fireEvent.click(screen.getByRole('button', { name: /倒數/i }))

      expect(mockOnChange).toHaveBeenCalledWith('countup')
    })

    it('點擊 toggle 按鈕應從 countup 切換到 countdown', () => {
      const mockOnChange = vi.fn()
      render(<ModeSelector mode="countup" onChange={mockOnChange} />)

      fireEvent.click(screen.getByRole('button', { name: /正數/i }))

      expect(mockOnChange).toHaveBeenCalledWith('countdown')
    })
  })

  describe('disabled 狀態', () => {
    it('disabled 時按鈕應被禁用', () => {
      render(<ModeSelector mode="countdown" onChange={vi.fn()} disabled />)

      expect(screen.getByRole('button', { name: /倒數/i })).toBeDisabled()
    })

    it('disabled 時點擊不應觸發 onChange', () => {
      const mockOnChange = vi.fn()
      render(<ModeSelector mode="countdown" onChange={mockOnChange} disabled />)

      fireEvent.click(screen.getByRole('button', { name: /倒數/i }))

      expect(mockOnChange).not.toHaveBeenCalled()
    })
  })
})
