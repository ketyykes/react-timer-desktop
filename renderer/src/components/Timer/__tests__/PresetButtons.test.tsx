import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PresetButtons } from '../PresetButtons'

describe('PresetButtons', () => {
  describe('顯示預設選項', () => {
    it('應顯示 5 分鐘按鈕', () => {
      render(<PresetButtons onSelect={vi.fn()} disabled={false} />)
      expect(screen.getByRole('button', { name: '5 分鐘' })).toBeInTheDocument()
    })

    it('應顯示 10 分鐘按鈕', () => {
      render(<PresetButtons onSelect={vi.fn()} disabled={false} />)
      expect(screen.getByRole('button', { name: '10 分鐘' })).toBeInTheDocument()
    })

    it('應顯示 25 分鐘按鈕', () => {
      render(<PresetButtons onSelect={vi.fn()} disabled={false} />)
      expect(screen.getByRole('button', { name: '25 分鐘' })).toBeInTheDocument()
    })

    it('應顯示 45 分鐘按鈕', () => {
      render(<PresetButtons onSelect={vi.fn()} disabled={false} />)
      expect(screen.getByRole('button', { name: '45 分鐘' })).toBeInTheDocument()
    })
  })

  describe('點擊行為', () => {
    it('點擊 5 分鐘應傳入 300000 毫秒', () => {
      const onSelect = vi.fn()
      render(<PresetButtons onSelect={onSelect} disabled={false} />)
      fireEvent.click(screen.getByRole('button', { name: '5 分鐘' }))
      expect(onSelect).toHaveBeenCalledWith(300000)
    })

    it('點擊 10 分鐘應傳入 600000 毫秒', () => {
      const onSelect = vi.fn()
      render(<PresetButtons onSelect={onSelect} disabled={false} />)
      fireEvent.click(screen.getByRole('button', { name: '10 分鐘' }))
      expect(onSelect).toHaveBeenCalledWith(600000)
    })

    it('點擊 25 分鐘應傳入 1500000 毫秒', () => {
      const onSelect = vi.fn()
      render(<PresetButtons onSelect={onSelect} disabled={false} />)
      fireEvent.click(screen.getByRole('button', { name: '25 分鐘' }))
      expect(onSelect).toHaveBeenCalledWith(1500000)
    })

    it('點擊 45 分鐘應傳入 2700000 毫秒', () => {
      const onSelect = vi.fn()
      render(<PresetButtons onSelect={onSelect} disabled={false} />)
      fireEvent.click(screen.getByRole('button', { name: '45 分鐘' }))
      expect(onSelect).toHaveBeenCalledWith(2700000)
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
