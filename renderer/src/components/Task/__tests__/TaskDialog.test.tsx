import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TaskDialog } from '../TaskDialog'

describe('TaskDialog', () => {
  const defaultProps = {
    open: true,
    duration: 300000, // 5 分鐘
    actualTime: 305000, // 5分5秒
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  }

  describe('渲染', () => {
    it('應顯示對話框標題', () => {
      render(<TaskDialog {...defaultProps} />)
      expect(screen.getByText('記錄任務')).toBeInTheDocument()
    })

    it('應顯示設定時間', () => {
      render(<TaskDialog {...defaultProps} />)
      expect(screen.getByText('設定時間：05:00')).toBeInTheDocument()
    })

    it('應顯示實際時間', () => {
      render(<TaskDialog {...defaultProps} />)
      expect(screen.getByText('實際時間：05:05')).toBeInTheDocument()
    })

    it('應有任務名稱輸入框', () => {
      render(<TaskDialog {...defaultProps} />)
      expect(screen.getByPlaceholderText('輸入任務名稱（選填）')).toBeInTheDocument()
    })

    it('應有確認按鈕', () => {
      render(<TaskDialog {...defaultProps} />)
      expect(screen.getByRole('button', { name: '儲存' })).toBeInTheDocument()
    })

    it('應有取消按鈕', () => {
      render(<TaskDialog {...defaultProps} />)
      expect(screen.getByRole('button', { name: '跳過' })).toBeInTheDocument()
    })

    it('關閉時不應顯示', () => {
      render(<TaskDialog {...defaultProps} open={false} />)
      expect(screen.queryByText('記錄任務')).not.toBeInTheDocument()
    })
  })

  describe('互動', () => {
    it('點擊確認應觸發 onConfirm 並傳遞任務名稱', () => {
      const onConfirm = vi.fn()
      render(<TaskDialog {...defaultProps} onConfirm={onConfirm} />)

      const input = screen.getByPlaceholderText('輸入任務名稱（選填）')
      fireEvent.change(input, { target: { value: '測試任務' } })
      fireEvent.click(screen.getByRole('button', { name: '儲存' }))

      expect(onConfirm).toHaveBeenCalledWith('測試任務')
    })

    it('點擊取消應觸發 onCancel', () => {
      const onCancel = vi.fn()
      render(<TaskDialog {...defaultProps} onCancel={onCancel} />)

      fireEvent.click(screen.getByRole('button', { name: '跳過' }))

      expect(onCancel).toHaveBeenCalled()
    })

    it('空名稱應傳遞空字串給 onConfirm', () => {
      const onConfirm = vi.fn()
      render(<TaskDialog {...defaultProps} onConfirm={onConfirm} />)

      fireEvent.click(screen.getByRole('button', { name: '儲存' }))

      expect(onConfirm).toHaveBeenCalledWith('')
    })

    it('按 Enter 鍵應觸發 onConfirm', () => {
      const onConfirm = vi.fn()
      render(<TaskDialog {...defaultProps} onConfirm={onConfirm} />)

      const input = screen.getByPlaceholderText('輸入任務名稱（選填）')
      fireEvent.change(input, { target: { value: '快捷任務' } })
      fireEvent.keyDown(input, { key: 'Enter' })

      expect(onConfirm).toHaveBeenCalledWith('快捷任務')
    })

    it('按 Escape 鍵應觸發 onCancel', () => {
      const onCancel = vi.fn()
      render(<TaskDialog {...defaultProps} onCancel={onCancel} />)

      const input = screen.getByPlaceholderText('輸入任務名稱（選填）')
      fireEvent.keyDown(input, { key: 'Escape' })

      expect(onCancel).toHaveBeenCalled()
    })
  })

  describe('overtime 顯示', () => {
    it('overtime 時間應顯示負數格式', () => {
      render(<TaskDialog {...defaultProps} duration={60000} actualTime={65000} />)
      expect(screen.getByText('設定時間：01:00')).toBeInTheDocument()
      expect(screen.getByText('實際時間：01:05')).toBeInTheDocument()
    })
  })

  describe('預填名稱功能', () => {
    it('應使用 defaultName 預填輸入框', () => {
      render(<TaskDialog {...defaultProps} defaultName="寫報告" />)
      expect(screen.getByDisplayValue('寫報告')).toBeInTheDocument()
    })

    it('defaultName 為空時輸入框應為空', () => {
      render(<TaskDialog {...defaultProps} defaultName="" />)
      expect(screen.getByPlaceholderText('輸入任務名稱（選填）')).toHaveValue('')
    })

    it('重新開啟時應重置為新的 defaultName', () => {
      const { rerender } = render(<TaskDialog {...defaultProps} open={false} defaultName="任務A" />)
      rerender(<TaskDialog {...defaultProps} open={true} defaultName="任務B" />)
      expect(screen.getByDisplayValue('任務B')).toBeInTheDocument()
    })
  })
})
