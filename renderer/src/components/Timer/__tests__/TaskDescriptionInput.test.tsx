import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TaskDescriptionInput } from '../TaskDescriptionInput'

describe('TaskDescriptionInput', () => {
  const defaultProps = {
    value: '',
    onChange: vi.fn(),
    disabled: false,
  }

  it('應顯示輸入框', () => {
    render(<TaskDescriptionInput {...defaultProps} />)
    expect(screen.getByPlaceholderText('這次要做什麼？（選填）')).toBeInTheDocument()
  })

  it('應顯示傳入的 value', () => {
    render(<TaskDescriptionInput {...defaultProps} value="寫報告" />)
    expect(screen.getByDisplayValue('寫報告')).toBeInTheDocument()
  })

  it('輸入時應呼叫 onChange', () => {
    const onChange = vi.fn()
    render(<TaskDescriptionInput {...defaultProps} onChange={onChange} />)
    const input = screen.getByPlaceholderText('這次要做什麼？（選填）')
    fireEvent.change(input, { target: { value: '回覆郵件' } })
    expect(onChange).toHaveBeenCalledWith('回覆郵件')
  })

  it('disabled 時輸入框應禁用', () => {
    render(<TaskDescriptionInput {...defaultProps} disabled={true} />)
    expect(screen.getByPlaceholderText('這次要做什麼？（選填）')).toBeDisabled()
  })
})
