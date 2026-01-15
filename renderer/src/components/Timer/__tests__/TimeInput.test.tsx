import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { useState } from 'react'
import { TimeInput } from '../TimeInput'

// 包裝元件用於測試 controlled component
function TimeInputWrapper({
  initialValue = '',
  onSubmit = vi.fn(),
  disabled = false,
  error = null,
}: {
  initialValue?: string
  onSubmit?: (ms: number) => void
  disabled?: boolean
  error?: string | null
}) {
  const [value, setValue] = useState(initialValue)
  return (
    <TimeInput
      value={value}
      onChange={setValue}
      onSubmit={onSubmit}
      disabled={disabled}
      error={error}
    />
  )
}

describe('TimeInput', () => {
  describe('輸入功能', () => {
    it('應顯示輸入框', () => {
      render(<TimeInputWrapper />)
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('可輸入時間字串', () => {
      render(<TimeInputWrapper />)
      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: '05:00' } })
      expect(input).toHaveValue('05:00')
    })

    it('按 Enter 應送出時間（毫秒）', () => {
      const onSubmit = vi.fn()
      render(<TimeInputWrapper onSubmit={onSubmit} />)
      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: '05:00' } })
      fireEvent.keyDown(input, { key: 'Enter' })
      expect(onSubmit).toHaveBeenCalledWith(300000)
    })

    it('onChange 應被觸發當輸入變更時', () => {
      const onChange = vi.fn()
      render(
        <TimeInput
          value=""
          onChange={onChange}
          onSubmit={vi.fn()}
          disabled={false}
        />
      )
      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: '05:00' } })
      expect(onChange).toHaveBeenCalledWith('05:00')
    })
  })

  describe('驗證功能', () => {
    it('無效格式不應觸發 onSubmit', () => {
      const onSubmit = vi.fn()
      render(<TimeInputWrapper onSubmit={onSubmit} />)
      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: 'invalid' } })
      fireEvent.keyDown(input, { key: 'Enter' })
      expect(onSubmit).not.toHaveBeenCalled()
    })

    it('空白輸入不應觸發 onSubmit', () => {
      const onSubmit = vi.fn()
      render(<TimeInputWrapper onSubmit={onSubmit} />)
      const input = screen.getByRole('textbox')
      fireEvent.keyDown(input, { key: 'Enter' })
      expect(onSubmit).not.toHaveBeenCalled()
    })

    it('應顯示錯誤訊息當 error prop 有值', () => {
      render(<TimeInputWrapper error="無效的時間格式" />)
      expect(screen.getByText(/無效的時間格式/i)).toBeInTheDocument()
    })

    it('error prop 為 null 時不應顯示錯誤訊息', () => {
      render(<TimeInputWrapper error={null} />)
      expect(screen.queryByText(/無效的時間格式/i)).not.toBeInTheDocument()
    })
  })

  describe('disabled 狀態', () => {
    it('disabled 時輸入框應禁用', () => {
      render(<TimeInputWrapper disabled={true} />)
      expect(screen.getByRole('textbox')).toBeDisabled()
    })
  })

  describe('純數字輸入', () => {
    it('純數字應視為秒數', () => {
      const onSubmit = vi.fn()
      render(<TimeInputWrapper onSubmit={onSubmit} />)
      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: '90' } })
      fireEvent.keyDown(input, { key: 'Enter' })
      expect(onSubmit).toHaveBeenCalledWith(90000)
    })
  })

  describe('非 Enter 按鍵', () => {
    it('按非 Enter 鍵不應觸發送出', () => {
      const onSubmit = vi.fn()
      render(<TimeInputWrapper onSubmit={onSubmit} />)
      const input = screen.getByRole('textbox')
      fireEvent.change(input, { target: { value: '05:00' } })
      fireEvent.keyDown(input, { key: 'a' })
      expect(onSubmit).not.toHaveBeenCalled()
    })
  })
})
