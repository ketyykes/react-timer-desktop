import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PinButton } from '../pin-button'

describe('PinButton', () => {
  it('renders unpinned state by default', () => {
    render(<PinButton isPinned={false} onClick={() => {}} />)
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false')
  })

  it('renders pinned state when isPinned is true', () => {
    render(<PinButton isPinned={true} onClick={() => {}} />)
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true')
  })

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn()
    render(<PinButton isPinned={false} onClick={handleClick} />)
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('shows correct tooltip for unpinned state', () => {
    render(<PinButton isPinned={false} onClick={() => {}} />)
    expect(screen.getByRole('button')).toHaveAttribute('title', '釘選視窗')
  })

  it('shows correct tooltip for pinned state', () => {
    render(<PinButton isPinned={true} onClick={() => {}} />)
    expect(screen.getByRole('button')).toHaveAttribute('title', '取消釘選')
  })
})
