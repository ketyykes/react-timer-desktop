import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PresetButtons } from '../PresetButtons'

describe('PresetButtons', () => {
  describe('顯示預設選項', () => {
    it('應顯示 5 分鐘按鈕', () => {
      render(<PresetButtons onSelect={vi.fn()} disabled={false} />)
      expect(screen.getByRole('button', { name: '5 分鐘' })).toBeInTheDocument()
    })

    it('應顯示 15 分鐘按鈕', () => {
      render(<PresetButtons onSelect={vi.fn()} disabled={false} />)
      expect(screen.getByRole('button', { name: '15 分鐘' })).toBeInTheDocument()
    })

    it('應顯示 25 分鐘按鈕', () => {
      render(<PresetButtons onSelect={vi.fn()} disabled={false} />)
      expect(screen.getByRole('button', { name: '25 分鐘' })).toBeInTheDocument()
    })

    it('應顯示 30 分鐘按鈕', () => {
      render(<PresetButtons onSelect={vi.fn()} disabled={false} />)
      expect(screen.getByRole('button', { name: '30 分鐘' })).toBeInTheDocument()
    })
  })

  describe('點擊行為', () => {
    it('點擊 5 分鐘應傳入 300000 毫秒', () => {
      const onSelect = vi.fn()
      render(<PresetButtons onSelect={onSelect} disabled={false} />)
      fireEvent.click(screen.getByRole('button', { name: '5 分鐘' }))
      expect(onSelect).toHaveBeenCalledWith(300000)
    })

    it('點擊 15 分鐘應傳入 900000 毫秒', () => {
      const onSelect = vi.fn()
      render(<PresetButtons onSelect={onSelect} disabled={false} />)
      fireEvent.click(screen.getByRole('button', { name: '15 分鐘' }))
      expect(onSelect).toHaveBeenCalledWith(900000)
    })

    it('點擊 25 分鐘應傳入 1500000 毫秒', () => {
      const onSelect = vi.fn()
      render(<PresetButtons onSelect={onSelect} disabled={false} />)
      fireEvent.click(screen.getByRole('button', { name: '25 分鐘' }))
      expect(onSelect).toHaveBeenCalledWith(1500000)
    })

    it('點擊 30 分鐘應傳入 1800000 毫秒', () => {
      const onSelect = vi.fn()
      render(<PresetButtons onSelect={onSelect} disabled={false} />)
      fireEvent.click(screen.getByRole('button', { name: '30 分鐘' }))
      expect(onSelect).toHaveBeenCalledWith(1800000)
    })
  })

  describe('disabled 狀態', () => {
    it('disabled 時所有按鈕應禁用', () => {
      render(<PresetButtons onSelect={vi.fn()} disabled={true} />)
      const buttons = screen.getAllByRole('button')
      buttons.forEach((button) => {
        expect(button).toBeDisabled()
      })
    })
  })
})
