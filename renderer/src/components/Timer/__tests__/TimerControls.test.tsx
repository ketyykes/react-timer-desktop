import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { TimerControls } from '../TimerControls'
import type { TimerState } from '../../../../../shared/types'

describe('TimerControls', () => {
  const defaultProps = {
    state: 'running' as TimerState,
    onPause: vi.fn(),
    onResume: vi.fn(),
    onStop: vi.fn(),
    onReset: vi.fn(),
  }

  describe('running 狀態', () => {
    it('應顯示暫停和停止按鈕', () => {
      render(<TimerControls {...defaultProps} state="running" />)
      expect(screen.getByRole('button', { name: /暫停/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /停止/i })).toBeInTheDocument()
    })

    it('不應顯示繼續按鈕', () => {
      render(<TimerControls {...defaultProps} state="running" />)
      expect(screen.queryByRole('button', { name: /繼續/i })).not.toBeInTheDocument()
    })

    it('點擊暫停應觸發 onPause', () => {
      const onPause = vi.fn()
      render(<TimerControls {...defaultProps} state="running" onPause={onPause} />)
      fireEvent.click(screen.getByRole('button', { name: /暫停/i }))
      expect(onPause).toHaveBeenCalledTimes(1)
    })

    it('點擊停止應觸發 onStop', () => {
      const onStop = vi.fn()
      render(<TimerControls {...defaultProps} state="running" onStop={onStop} />)
      fireEvent.click(screen.getByRole('button', { name: /停止/i }))
      expect(onStop).toHaveBeenCalledTimes(1)
    })
  })

  describe('paused 狀態', () => {
    it('應顯示繼續和停止按鈕', () => {
      render(<TimerControls {...defaultProps} state="paused" />)
      expect(screen.getByRole('button', { name: /繼續/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /停止/i })).toBeInTheDocument()
    })

    it('不應顯示暫停按鈕', () => {
      render(<TimerControls {...defaultProps} state="paused" />)
      expect(screen.queryByRole('button', { name: /暫停/i })).not.toBeInTheDocument()
    })

    it('點擊繼續應觸發 onResume', () => {
      const onResume = vi.fn()
      render(<TimerControls {...defaultProps} state="paused" onResume={onResume} />)
      fireEvent.click(screen.getByRole('button', { name: /繼續/i }))
      expect(onResume).toHaveBeenCalledTimes(1)
    })
  })

  describe('overtime 狀態', () => {
    it('應顯示停止按鈕', () => {
      render(<TimerControls {...defaultProps} state="overtime" />)
      expect(screen.getByRole('button', { name: /停止/i })).toBeInTheDocument()
    })

    it('不應顯示暫停或繼續按鈕', () => {
      render(<TimerControls {...defaultProps} state="overtime" />)
      expect(screen.queryByRole('button', { name: /暫停/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /繼續/i })).not.toBeInTheDocument()
    })

    it('點擊停止應觸發 onStop', () => {
      const onStop = vi.fn()
      render(<TimerControls {...defaultProps} state="overtime" onStop={onStop} />)
      fireEvent.click(screen.getByRole('button', { name: /停止/i }))
      expect(onStop).toHaveBeenCalledTimes(1)
    })
  })
})
