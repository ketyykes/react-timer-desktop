import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TimeInput } from '../TimeInput'

describe('TimeInput', () => {
  describe('輸入功能', () => {
    it('應顯示輸入框', () => {
      render(<TimeInput onSubmit={vi.fn()} disabled={false} />)
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('可輸入時間字串', () => {
      render(<TimeInput onSubmit={vi.fn()} disabled={false} />)
      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: '05:00' } })
      expect(input).toHaveValue('05:00')
    })

    it('按 Enter 應送出時間（毫秒）', () => {
      const onSubmit = vi.fn()
      render(<TimeInput onSubmit={onSubmit} disabled={false} />)
      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: '05:00' } })
      fireEvent.keyDown(input, { key: 'Enter' })
      expect(onSubmit).toHaveBeenCalledWith(300000)
    })

    it('送出後應清空輸入框', () => {
      render(<TimeInput onSubmit={vi.fn()} disabled={false} />)
      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: '05:00' } })
      fireEvent.keyDown(input, { key: 'Enter' })
      expect(input).toHaveValue('')
    })
  })

  describe('驗證功能', () => {
    it('無效格式應顯示錯誤訊息', () => {
      render(<TimeInput onSubmit={vi.fn()} disabled={false} />)
      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: 'invalid' } })
      fireEvent.keyDown(input, { key: 'Enter' })
      expect(screen.getByText(/無效的時間格式/i)).toBeInTheDocument()
    })

    it('無效格式不應觸發 onSubmit', () => {
      const onSubmit = vi.fn()
      render(<TimeInput onSubmit={onSubmit} disabled={false} />)
      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: 'invalid' } })
      fireEvent.keyDown(input, { key: 'Enter' })
      expect(onSubmit).not.toHaveBeenCalled()
    })

    it('空白輸入不應觸發 onSubmit', () => {
      const onSubmit = vi.fn()
      render(<TimeInput onSubmit={onSubmit} disabled={false} />)
      const input = screen.getByRole('textbox')
      fireEvent.keyDown(input, { key: 'Enter' })
      expect(onSubmit).not.toHaveBeenCalled()
    })

    it('重新輸入時應清除錯誤訊息', () => {
      render(<TimeInput onSubmit={vi.fn()} disabled={false} />)
      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: 'invalid' } })
      fireEvent.keyDown(input, { key: 'Enter' })
      expect(screen.getByText(/無效的時間格式/i)).toBeInTheDocument()
      fireEvent.change(input, { target: { value: '05:00' } })
      expect(screen.queryByText(/無效的時間格式/i)).not.toBeInTheDocument()
    })
  })

  describe('disabled 狀態', () => {
    it('disabled 時輸入框應禁用', () => {
      render(<TimeInput onSubmit={vi.fn()} disabled={true} />)
      expect(screen.getByRole('textbox')).toBeDisabled()
    })
  })

  describe('純數字輸入', () => {
    it('純數字應視為秒數', () => {
      const onSubmit = vi.fn()
      render(<TimeInput onSubmit={onSubmit} disabled={false} />)
      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: '90' } })
      fireEvent.keyDown(input, { key: 'Enter' })
      expect(onSubmit).toHaveBeenCalledWith(90000)
    })
  })

  describe('非 Enter 按鍵', () => {
    it('按非 Enter 鍵不應觸發送出', () => {
      const onSubmit = vi.fn()
      render(<TimeInput onSubmit={onSubmit} disabled={false} />)
      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: '05:00' } })
      fireEvent.keyDown(input, { key: 'a' })
      expect(onSubmit).not.toHaveBeenCalled()
    })
  })
})
