# UI/UX 優化實作計畫

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 優化計時器 UI/UX，移除 Tabs 改為單頁整合，提升操作效率

**Architecture:** 移除 Tabs 結構，將計時器和今日記錄整合於單一畫面。TimerDisplay 整合時間輸入功能，PresetButtons 點擊直接開始。新增 TodayTasks 元件顯示今日記錄（最多 3 筆），完整歷史記錄另開獨立視窗。

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, Electron 33, Vitest

**Design Doc:** `docs/plans/2026-01-18-ui-optimization-design.md`

---

## Task 1: PresetButtons 縮小按鈕並一行排列

**Files:**
- Modify: `renderer/src/components/Timer/PresetButtons.tsx`
- Modify: `renderer/src/components/Timer/__tests__/PresetButtons.test.tsx`

**Step 1: 更新測試以驗證新的一行排列佈局**

在 `PresetButtons.test.tsx` 新增測試：

```typescript
it('應該使用 grid-cols-4 佈局一行排列', () => {
  render(<PresetButtons onSelect={mockOnSelect} disabled={false} />)
  const container = screen.getByRole('group')
  expect(container).toHaveClass('grid-cols-4')
})

it('按鈕應該使用 size="sm"', () => {
  render(<PresetButtons onSelect={mockOnSelect} disabled={false} />)
  const buttons = screen.getAllByRole('button')
  buttons.forEach((button) => {
    expect(button).toHaveClass('h-8') // sm size
  })
})
```

**Step 2: 執行測試確認失敗**

Run: `cd renderer && pnpm test -- PresetButtons.test.tsx`
Expected: FAIL - grid-cols-4 not found

**Step 3: 更新 PresetButtons 元件**

修改 `PresetButtons.tsx`：

```typescript
export function PresetButtons({ onSelect, disabled }: PresetButtonsProps) {
  return (
    <div role="group" className="grid grid-cols-4 gap-1.5 w-full">
      {PRESETS.map((preset) => (
        <Button
          key={preset.ms}
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => onSelect(preset.ms)}
        >
          {preset.label}
        </Button>
      ))}
    </div>
  )
}
```

**Step 4: 執行測試確認通過**

Run: `cd renderer && pnpm test -- PresetButtons.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add renderer/src/components/Timer/PresetButtons.tsx renderer/src/components/Timer/__tests__/PresetButtons.test.tsx
git commit -m "refactor(PresetButtons): 縮小按鈕並改為一行排列"
```

---

## Task 2: TimerDisplay 新增點擊編輯時間功能

**Files:**
- Modify: `renderer/src/components/Timer/TimerDisplay.tsx`
- Modify: `renderer/src/components/Timer/__tests__/TimerDisplay.test.tsx`

**Step 1: 新增測試案例**

在 `TimerDisplay.test.tsx` 新增：

```typescript
describe('編輯模式', () => {
  const editableProps = {
    displayTime: 0,
    isOvertime: false,
    mode: 'countdown' as const,
    editable: true,
    onTimeChange: vi.fn(),
  }

  it('editable 為 true 時點擊應進入編輯模式', async () => {
    const user = userEvent.setup()
    render(<TimerDisplay {...editableProps} />)

    await user.click(screen.getByTestId('timer-display'))
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('編輯模式下輸入時間並按 Enter 應呼叫 onTimeChange', async () => {
    const user = userEvent.setup()
    const onTimeChange = vi.fn()
    render(<TimerDisplay {...editableProps} onTimeChange={onTimeChange} />)

    await user.click(screen.getByTestId('timer-display'))
    const input = screen.getByRole('textbox')
    await user.clear(input)
    await user.type(input, '5:00{Enter}')

    expect(onTimeChange).toHaveBeenCalledWith(300000) // 5 分鐘
  })

  it('編輯模式下按 Escape 應取消編輯', async () => {
    const user = userEvent.setup()
    render(<TimerDisplay {...editableProps} />)

    await user.click(screen.getByTestId('timer-display'))
    await user.keyboard('{Escape}')

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('editable 為 false 時點擊不應進入編輯模式', async () => {
    const user = userEvent.setup()
    render(<TimerDisplay {...editableProps} editable={false} />)

    await user.click(screen.getByTestId('timer-display'))
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })
})
```

**Step 2: 執行測試確認失敗**

Run: `cd renderer && pnpm test -- TimerDisplay.test.tsx`
Expected: FAIL - editable prop not supported

**Step 3: 實作 TimerDisplay 編輯功能**

修改 `TimerDisplay.tsx`：

```typescript
import { useState, useCallback, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { formatTime, parseTime, type TimerMode } from '../../../../shared/types'

export interface TimerDisplayProps {
  displayTime: number
  isOvertime: boolean
  mode: TimerMode
  /** 是否可編輯（idle 狀態時為 true） */
  editable?: boolean
  /** 時間變更回調（毫秒） */
  onTimeChange?: (ms: number) => void
}

export function TimerDisplay({
  displayTime,
  isOvertime,
  mode,
  editable = false,
  onTimeChange,
}: TimerDisplayProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const prefix = mode === 'countup' && isOvertime ? '+' : ''
  const useCeil = mode === 'countdown'
  const formattedTime = formatTime(displayTime, useCeil)

  const handleClick = useCallback(() => {
    if (editable && !isEditing) {
      setIsEditing(true)
      setInputValue('')
    }
  }, [editable, isEditing])

  const handleSubmit = useCallback(() => {
    const trimmed = inputValue.trim()
    if (trimmed && onTimeChange) {
      try {
        const ms = parseTime(trimmed)
        onTimeChange(ms)
      } catch {
        // 無效格式，忽略
      }
    }
    setIsEditing(false)
  }, [inputValue, onTimeChange])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSubmit()
      } else if (e.key === 'Escape') {
        setIsEditing(false)
      }
    },
    [handleSubmit]
  )

  const handleBlur = useCallback(() => {
    setIsEditing(false)
  }, [])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isEditing])

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder="0:00"
        className={cn(
          'text-5xl font-mono font-bold tabular-nums text-center',
          'bg-transparent border-b-2 border-blue-500 outline-none',
          'w-32'
        )}
      />
    )
  }

  return (
    <div
      data-testid="timer-display"
      onClick={handleClick}
      className={cn(
        'text-5xl font-mono font-bold tabular-nums',
        'text-gray-900',
        isOvertime && 'text-red-500',
        editable && 'cursor-pointer hover:text-blue-600 transition-colors'
      )}
    >
      {prefix}{formattedTime}
    </div>
  )
}
```

**Step 4: 執行測試確認通過**

Run: `cd renderer && pnpm test -- TimerDisplay.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add renderer/src/components/Timer/TimerDisplay.tsx renderer/src/components/Timer/__tests__/TimerDisplay.test.tsx
git commit -m "feat(TimerDisplay): 新增點擊編輯時間功能"
```

---

## Task 3: Timer 元件整合新設計

**Files:**
- Modify: `renderer/src/components/Timer/Timer.tsx`
- Modify: `renderer/src/components/Timer/__tests__/Timer.test.tsx`

**Step 1: 更新測試案例**

修改 `Timer.test.tsx`，新增：

```typescript
describe('新 UI 流程', () => {
  it('點擊 TimerDisplay 應可輸入時間', async () => {
    const user = userEvent.setup()
    render(<Timer {...defaultProps} />)

    await user.click(screen.getByTestId('timer-display'))
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('點擊預設按鈕應直接開始計時', async () => {
    const user = userEvent.setup()
    render(<Timer {...defaultProps} />)

    await user.click(screen.getByText('5 分鐘'))

    await waitFor(() => {
      expect(mockStart).toHaveBeenCalledWith(300000, 'countdown')
    })
  })

  it('running 狀態應顯示任務描述（唯讀）', async () => {
    mockUseTimer.mockReturnValue({
      ...defaultTimerState,
      state: 'running',
    })

    render(<Timer {...defaultProps} taskDescription="測試任務" />)

    expect(screen.getByText('「測試任務」')).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('這次要做什麼？')).not.toBeInTheDocument()
  })
})
```

**Step 2: 執行測試確認失敗**

Run: `cd renderer && pnpm test -- Timer.test.tsx`
Expected: FAIL

**Step 3: 重構 Timer 元件**

修改 `Timer.tsx`：

```typescript
import { useCallback, useState } from 'react'
import { useTimer } from '@/hooks/useTimer'
import type { TimerMode } from '../../../../shared/types'
import { TimerDisplay } from './TimerDisplay'
import { TimerControls } from './TimerControls'
import { PresetButtons } from './PresetButtons'
import { TaskDescriptionInput } from './TaskDescriptionInput'
import { Button } from '@/components/ui/button'
import { ArrowDownToLine, ArrowUpFromLine } from 'lucide-react'

export interface TimerProps {
  taskDescription: string
  onTaskDescriptionChange: (value: string) => void
  onStop: (data: { duration: number; actualElapsed: number; mode: TimerMode }) => void
}

export function Timer({ taskDescription, onTaskDescriptionChange, onStop }: TimerProps) {
  const {
    state,
    mode,
    duration,
    elapsed,
    displayTime,
    isOvertime,
    start,
    pause,
    resume,
    stop,
    reset,
  } = useTimer()

  const [selectedMode, setSelectedMode] = useState<TimerMode>('countdown')
  const [isStarting, setIsStarting] = useState(false)
  const [pendingTime, setPendingTime] = useState<number | null>(null)

  const isIdle = state === 'idle'

  const handleStop = useCallback(async () => {
    const stopData = { duration, actualElapsed: elapsed, mode }
    await stop()
    onStop(stopData)
  }, [duration, elapsed, mode, stop, onStop])

  const startTimer = useCallback(async (ms: number) => {
    if (isStarting) return
    setIsStarting(true)
    try {
      await start(ms, selectedMode)
      setPendingTime(null)
    } finally {
      setIsStarting(false)
    }
  }, [start, isStarting, selectedMode])

  // TimerDisplay 時間變更 → 設定 pendingTime
  const handleTimeChange = useCallback((ms: number) => {
    setPendingTime(ms)
  }, [])

  // 預設按鈕點擊 → 直接開始
  const handlePresetSelect = useCallback(async (ms: number) => {
    await startTimer(ms)
  }, [startTimer])

  // 開始按鈕點擊
  const handleStart = useCallback(async () => {
    if (pendingTime && pendingTime > 0) {
      await startTimer(pendingTime)
    }
  }, [pendingTime, startTimer])

  // 模式切換
  const handleModeToggle = useCallback(() => {
    setSelectedMode((prev) => (prev === 'countdown' ? 'countup' : 'countdown'))
  }, [])

  const displayMode = isIdle ? selectedMode : mode
  const ModeIcon = displayMode === 'countdown' ? ArrowDownToLine : ArrowUpFromLine
  const modeLabel = displayMode === 'countdown' ? '倒數' : '正數'

  return (
    <div className="flex flex-col items-center justify-center gap-4 text-center">
      <TimerDisplay
        displayTime={pendingTime ?? displayTime}
        isOvertime={isOvertime}
        mode={displayMode}
        editable={isIdle}
        onTimeChange={handleTimeChange}
      />

      {isIdle ? (
        <div className="flex flex-col items-center gap-3 w-full">
          <TaskDescriptionInput
            value={taskDescription}
            onChange={onTaskDescriptionChange}
            disabled={isStarting}
          />
          <PresetButtons onSelect={handlePresetSelect} disabled={isStarting} />
          <div className="flex gap-2 items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={handleModeToggle}
              disabled={isStarting}
              className="gap-1.5"
            >
              <ModeIcon className="h-4 w-4" />
              {modeLabel}
            </Button>
            <Button onClick={handleStart} disabled={isStarting || !pendingTime}>
              開始
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          {taskDescription && (
            <p className="text-sm text-muted-foreground">「{taskDescription}」</p>
          )}
          <TimerControls
            state={state}
            onPause={pause}
            onResume={resume}
            onStop={handleStop}
            onReset={reset}
          />
        </div>
      )}
    </div>
  )
}
```

**Step 4: 執行測試確認通過**

Run: `cd renderer && pnpm test -- Timer.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add renderer/src/components/Timer/Timer.tsx renderer/src/components/Timer/__tests__/Timer.test.tsx
git commit -m "refactor(Timer): 整合新 UI 設計，預設按鈕直接開始"
```

---

## Task 4: 新增 task:update IPC channel

**Files:**
- Modify: `shared/types.ts`
- Modify: `main/ipc/taskHandlers.ts`
- Modify: `main/ipc/__tests__/taskHandlers.test.ts`
- Modify: `main/__tests__/preload.test.ts`
- Modify: `main/preload.ts`

**Step 1: 新增 IPC channel 常數**

修改 `shared/types.ts`，在 `IPC_CHANNELS` 新增：

```typescript
export const IPC_CHANNELS = {
  // ... 現有的
  TASK_UPDATE: 'task:update',
} as const
```

**Step 2: 新增 taskHandlers 測試**

在 `taskHandlers.test.ts` 新增：

```typescript
describe('task:update', () => {
  it('應該更新任務名稱', async () => {
    const saved = await handlers['task:save'](null as any, {
      name: '原始名稱',
      duration: 300000,
      actualTime: 300000,
    })

    const updated = await handlers['task:update'](null as any, {
      id: saved.id,
      name: '新名稱',
    })

    expect(updated.name).toBe('新名稱')
    expect(updated.id).toBe(saved.id)
  })

  it('找不到任務時應該拋出錯誤', async () => {
    await expect(
      handlers['task:update'](null as any, { id: 'not-exist', name: 'test' })
    ).rejects.toThrow()
  })
})
```

**Step 3: 執行測試確認失敗**

Run: `pnpm test -- taskHandlers.test.ts`
Expected: FAIL - task:update not defined

**Step 4: 實作 task:update handler**

修改 `main/ipc/taskHandlers.ts`：

```typescript
import { ipcMain } from 'electron'
import { IPC_CHANNELS, type TaskRecord } from '../../shared/types'
import { TaskStore } from '../store/TaskStore'

export function registerTaskHandlers(store: TaskStore) {
  // ... 現有的 handlers

  ipcMain.handle(
    IPC_CHANNELS.TASK_UPDATE,
    async (_event, data: { id: string; name: string }): Promise<TaskRecord> => {
      return store.update(data.id, { name: data.name })
    }
  )
}
```

**Step 5: 新增 TaskStore.update 方法**

修改 `main/store/TaskStore.ts`：

```typescript
update(id: string, data: { name: string }): TaskRecord {
  const tasks = this.store.get('tasks') as TaskRecord[]
  const index = tasks.findIndex((t) => t.id === id)
  if (index === -1) {
    throw new Error(`Task not found: ${id}`)
  }
  tasks[index] = { ...tasks[index], ...data }
  this.store.set('tasks', tasks)
  return tasks[index]
}
```

**Step 6: 更新 preload.ts 暴露 task.update**

修改 `main/preload.ts`：

```typescript
task: {
  // ... 現有的
  update: (data: { id: string; name: string }) =>
    ipcRenderer.invoke(IPC_CHANNELS.TASK_UPDATE, data),
},
```

**Step 7: 執行測試確認通過**

Run: `pnpm test -- taskHandlers.test.ts`
Expected: PASS

**Step 8: Commit**

```bash
git add shared/types.ts main/ipc/taskHandlers.ts main/store/TaskStore.ts main/preload.ts main/ipc/__tests__/taskHandlers.test.ts
git commit -m "feat(ipc): 新增 task:update channel 支援任務編輯"
```

---

## Task 5: 新增 TodayTasks 元件

**Files:**
- Create: `renderer/src/components/Task/TodayTasks.tsx`
- Create: `renderer/src/components/Task/__tests__/TodayTasks.test.tsx`

**Step 1: 建立測試檔案**

建立 `TodayTasks.test.tsx`：

```typescript
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TodayTasks } from '../TodayTasks'
import type { TaskRecord } from '../../../../../shared/types'

const mockTasks: TaskRecord[] = [
  { id: '1', name: '任務一', duration: 300000, actualTime: 300000, createdAt: Date.now() },
  { id: '2', name: '任務二', duration: 600000, actualTime: 550000, createdAt: Date.now() - 1000 },
  { id: '3', name: '任務三', duration: 900000, actualTime: 900000, createdAt: Date.now() - 2000 },
  { id: '4', name: '任務四', duration: 1200000, actualTime: 1200000, createdAt: Date.now() - 3000 },
]

describe('TodayTasks', () => {
  const defaultProps = {
    tasks: mockTasks,
    onUpdate: vi.fn(),
    onDelete: vi.fn(),
    onViewAll: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('最多顯示 3 筆任務', () => {
    render(<TodayTasks {...defaultProps} />)
    const items = screen.getAllByTestId('today-task-item')
    expect(items).toHaveLength(3)
  })

  it('無任務時顯示空狀態', () => {
    render(<TodayTasks {...defaultProps} tasks={[]} />)
    expect(screen.getByText('今天還沒有完成任務')).toBeInTheDocument()
  })

  it('點擊任務名稱應進入編輯模式', async () => {
    const user = userEvent.setup()
    render(<TodayTasks {...defaultProps} />)

    await user.click(screen.getByText('任務一'))
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('編輯後按 Enter 應呼叫 onUpdate', async () => {
    const user = userEvent.setup()
    const onUpdate = vi.fn()
    render(<TodayTasks {...defaultProps} onUpdate={onUpdate} />)

    await user.click(screen.getByText('任務一'))
    const input = screen.getByRole('textbox')
    await user.clear(input)
    await user.type(input, '新名稱{Enter}')

    expect(onUpdate).toHaveBeenCalledWith('1', '新名稱')
  })

  it('點擊刪除應顯示確認按鈕', async () => {
    const user = userEvent.setup()
    render(<TodayTasks {...defaultProps} />)

    const deleteButtons = screen.getAllByLabelText('刪除')
    await user.click(deleteButtons[0])

    expect(screen.getByText('確認刪除')).toBeInTheDocument()
    expect(screen.getByText('取消')).toBeInTheDocument()
  })

  it('確認刪除應呼叫 onDelete', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    render(<TodayTasks {...defaultProps} onDelete={onDelete} />)

    const deleteButtons = screen.getAllByLabelText('刪除')
    await user.click(deleteButtons[0])
    await user.click(screen.getByText('確認刪除'))

    expect(onDelete).toHaveBeenCalledWith('1')
  })

  it('點擊取消應恢復正常顯示', async () => {
    const user = userEvent.setup()
    render(<TodayTasks {...defaultProps} />)

    const deleteButtons = screen.getAllByLabelText('刪除')
    await user.click(deleteButtons[0])
    await user.click(screen.getByText('取消'))

    expect(screen.queryByText('確認刪除')).not.toBeInTheDocument()
  })

  it('點擊查看全部應呼叫 onViewAll', async () => {
    const user = userEvent.setup()
    const onViewAll = vi.fn()
    render(<TodayTasks {...defaultProps} onViewAll={onViewAll} />)

    await user.click(screen.getByText('查看全部'))
    expect(onViewAll).toHaveBeenCalled()
  })
})
```

**Step 2: 執行測試確認失敗**

Run: `cd renderer && pnpm test -- TodayTasks.test.tsx`
Expected: FAIL - module not found

**Step 3: 實作 TodayTasks 元件**

建立 `TodayTasks.tsx`：

```typescript
import { useState, useCallback } from 'react'
import type { TaskRecord } from '../../../../shared/types'
import { formatTime } from '../../../../shared/types'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'

export interface TodayTasksProps {
  tasks: TaskRecord[]
  onUpdate: (id: string, name: string) => void
  onDelete: (id: string) => void
  onViewAll: () => void
}

function formatTimeOfDay(timestamp: number): string {
  const date = new Date(timestamp)
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

export function TodayTasks({ tasks, onUpdate, onDelete, onViewAll }: TodayTasksProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // 只顯示最近 3 筆
  const displayTasks = [...tasks]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 3)

  const handleNameClick = useCallback((task: TaskRecord) => {
    setEditingId(task.id)
    setEditValue(task.name)
    setDeletingId(null)
  }, [])

  const handleEditSubmit = useCallback(() => {
    if (editingId && editValue.trim()) {
      onUpdate(editingId, editValue.trim())
    }
    setEditingId(null)
  }, [editingId, editValue, onUpdate])

  const handleEditKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleEditSubmit()
      } else if (e.key === 'Escape') {
        setEditingId(null)
      }
    },
    [handleEditSubmit]
  )

  const handleDeleteClick = useCallback((id: string) => {
    setDeletingId(id)
    setEditingId(null)
  }, [])

  const handleDeleteConfirm = useCallback(() => {
    if (deletingId) {
      onDelete(deletingId)
    }
    setDeletingId(null)
  }, [deletingId, onDelete])

  const handleDeleteCancel = useCallback(() => {
    setDeletingId(null)
  }, [])

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">今日</span>
        <Button variant="link" size="sm" className="h-auto p-0" onClick={onViewAll}>
          查看全部
        </Button>
      </div>

      {displayTasks.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          今天還沒有完成任務
        </p>
      ) : (
        <ul className="space-y-1">
          {displayTasks.map((task) => (
            <li
              key={task.id}
              data-testid="today-task-item"
              className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-muted/50 text-sm"
            >
              {deletingId === task.id ? (
                // 刪除確認狀態
                <div className="flex-1 flex items-center justify-between">
                  <span className="truncate">{task.name}</span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={handleDeleteCancel}
                    >
                      取消
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={handleDeleteConfirm}
                    >
                      確認刪除
                    </Button>
                  </div>
                </div>
              ) : editingId === task.id ? (
                // 編輯狀態
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleEditKeyDown}
                  onBlur={handleEditSubmit}
                  autoFocus
                  className="flex-1 bg-transparent border-b border-blue-500 outline-none text-sm"
                />
              ) : (
                // 正常狀態
                <>
                  <span
                    className="flex-1 truncate cursor-pointer hover:text-blue-600"
                    onClick={() => handleNameClick(task)}
                  >
                    {task.name}
                  </span>
                  <span className="text-muted-foreground tabular-nums">
                    {formatTime(task.duration)}
                  </span>
                  <span className="text-muted-foreground tabular-nums">
                    {formatTimeOfDay(task.createdAt)}
                  </span>
                  <button
                    aria-label="刪除"
                    onClick={() => handleDeleteClick(task.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

**Step 4: 執行測試確認通過**

Run: `cd renderer && pnpm test -- TodayTasks.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add renderer/src/components/Task/TodayTasks.tsx renderer/src/components/Task/__tests__/TodayTasks.test.tsx
git commit -m "feat(TodayTasks): 新增今日記錄元件，支援編輯和刪除確認"
```

---

## Task 6: App.tsx 移除 Tabs，整合新佈局

**Files:**
- Modify: `renderer/src/App.tsx`
- Modify: `renderer/src/__tests__/App.test.tsx`

**Step 1: 更新測試**

修改 `App.test.tsx`，移除 Tabs 相關測試，新增：

```typescript
describe('單頁整合佈局', () => {
  it('應該同時顯示計時器和今日記錄', () => {
    render(<App />)

    expect(screen.getByTestId('timer-display')).toBeInTheDocument()
    expect(screen.getByText('今日')).toBeInTheDocument()
  })

  it('不應該有 Tabs', () => {
    render(<App />)

    expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
  })

  it('點擊查看全部應呼叫 openHistoryWindow', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(screen.getByText('查看全部'))

    expect(mockElectronAPI.history.open).toHaveBeenCalled()
  })
})
```

**Step 2: 執行測試確認失敗**

Run: `cd renderer && pnpm test -- App.test.tsx`
Expected: FAIL

**Step 3: 重構 App.tsx**

```typescript
import { useState, useEffect, useCallback } from 'react'
import { Timer } from '@/components/Timer'
import { TaskDialog } from '@/components/Task/TaskDialog'
import { TodayTasks } from '@/components/Task/TodayTasks'
import type { TaskRecord, TimerMode } from '../../shared/types'

function isToday(timestamp: number): boolean {
  const date = new Date(timestamp)
  const today = new Date()
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  )
}

const App = () => {
  const [taskDialogOpen, setTaskDialogOpen] = useState(false)
  const [completedTask, setCompletedTask] = useState<{
    duration: number
    actualTime: number
    description: string
  } | null>(null)
  const [tasks, setTasks] = useState<TaskRecord[]>([])
  const [taskDescription, setTaskDescription] = useState('')

  // 載入今日任務
  const loadTasks = useCallback(async () => {
    const api = window.electronAPI?.task
    if (api) {
      const allTasks = await api.getAll()
      // 只保留今天的任務
      setTasks(allTasks.filter((t) => isToday(t.createdAt)))
    }
  }, [])

  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  const handleTimerStop = useCallback(
    (data: { duration: number; actualElapsed: number; mode: TimerMode }) => {
      setCompletedTask({
        duration: data.duration,
        actualTime: data.actualElapsed,
        description: taskDescription,
      })
      setTaskDialogOpen(true)
    },
    [taskDescription]
  )

  const handleTaskConfirm = useCallback(
    async (name: string) => {
      if (completedTask) {
        const api = window.electronAPI?.task
        if (api) {
          await api.save({
            name: name || '未命名任務',
            duration: completedTask.duration,
            actualTime: completedTask.actualTime,
          })
          await loadTasks()
        }
      }
      setTaskDialogOpen(false)
      setCompletedTask(null)
      setTaskDescription('')
    },
    [completedTask, loadTasks]
  )

  const handleTaskCancel = useCallback(() => {
    setTaskDialogOpen(false)
    setCompletedTask(null)
    setTaskDescription('')
  }, [])

  const handleTaskUpdate = useCallback(
    async (id: string, name: string) => {
      const api = window.electronAPI?.task
      if (api?.update) {
        await api.update({ id, name })
        await loadTasks()
      }
    },
    [loadTasks]
  )

  const handleTaskDelete = useCallback(
    async (id: string) => {
      const api = window.electronAPI?.task
      if (api) {
        await api.delete(id)
        await loadTasks()
      }
    },
    [loadTasks]
  )

  const handleViewAll = useCallback(() => {
    window.electronAPI?.history?.open()
  }, [])

  return (
    <div className="h-full bg-white flex flex-col">
      {/* 計時器區塊 (75%) */}
      <div className="flex-[3] flex items-center justify-center p-4">
        <div className="w-full max-w-xs">
          <Timer
            taskDescription={taskDescription}
            onTaskDescriptionChange={setTaskDescription}
            onStop={handleTimerStop}
          />
        </div>
      </div>

      {/* 分隔線 */}
      <div className="border-t border-gray-200" />

      {/* 今日記錄區塊 (25%) */}
      <div className="flex-1 p-3 bg-gray-50/50">
        <TodayTasks
          tasks={tasks}
          onUpdate={handleTaskUpdate}
          onDelete={handleTaskDelete}
          onViewAll={handleViewAll}
        />
      </div>

      <TaskDialog
        open={taskDialogOpen}
        duration={completedTask?.duration ?? 0}
        actualTime={completedTask?.actualTime ?? 0}
        defaultName={completedTask?.description ?? ''}
        onConfirm={handleTaskConfirm}
        onCancel={handleTaskCancel}
      />
    </div>
  )
}

export default App
```

**Step 4: 執行測試確認通過**

Run: `cd renderer && pnpm test -- App.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add renderer/src/App.tsx renderer/src/__tests__/App.test.tsx
git commit -m "refactor(App): 移除 Tabs，整合計時器和今日記錄單頁佈局"
```

---

## Task 7: 新增 history:open IPC channel（Electron 側）

**Files:**
- Modify: `shared/types.ts`
- Create: `main/historyWindow.ts`
- Create: `main/__tests__/historyWindow.test.ts`
- Modify: `main/main.ts`
- Modify: `main/preload.ts`

**Step 1: 新增 IPC channel 常數**

修改 `shared/types.ts`：

```typescript
export const IPC_CHANNELS = {
  // ... 現有的
  HISTORY_OPEN: 'history:open',
} as const
```

**Step 2: 建立測試**

建立 `main/__tests__/historyWindow.test.ts`：

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BrowserWindow } from 'electron'

vi.mock('electron', () => ({
  BrowserWindow: vi.fn(() => ({
    loadFile: vi.fn(),
    loadURL: vi.fn(),
    show: vi.fn(),
    on: vi.fn(),
    focus: vi.fn(),
    isDestroyed: vi.fn(() => false),
  })),
  ipcMain: { handle: vi.fn() },
}))

import { createHistoryWindow, getHistoryWindow } from '../historyWindow'

describe('historyWindow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('createHistoryWindow 應該建立 BrowserWindow', () => {
    createHistoryWindow()
    expect(BrowserWindow).toHaveBeenCalledWith(
      expect.objectContaining({
        width: 400,
        height: 500,
        title: '歷史記錄',
      })
    )
  })

  it('再次呼叫應該 focus 現有視窗而非建立新的', () => {
    const window = createHistoryWindow()
    const window2 = createHistoryWindow()

    expect(window).toBe(window2)
    expect(window.focus).toHaveBeenCalled()
  })
})
```

**Step 3: 執行測試確認失敗**

Run: `pnpm test -- historyWindow.test.ts`
Expected: FAIL - module not found

**Step 4: 實作 historyWindow**

建立 `main/historyWindow.ts`：

```typescript
import { BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import { IPC_CHANNELS } from '../shared/types'

let historyWindow: BrowserWindow | null = null

export function createHistoryWindow(): BrowserWindow {
  if (historyWindow && !historyWindow.isDestroyed()) {
    historyWindow.focus()
    return historyWindow
  }

  historyWindow = new BrowserWindow({
    width: 400,
    height: 500,
    title: '歷史記錄',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (process.env.NODE_ENV === 'development') {
    historyWindow.loadURL('http://localhost:5173/history.html')
  } else {
    historyWindow.loadFile(path.join(__dirname, '../renderer/history.html'))
  }

  historyWindow.on('closed', () => {
    historyWindow = null
  })

  return historyWindow
}

export function getHistoryWindow(): BrowserWindow | null {
  return historyWindow
}

export function registerHistoryHandlers() {
  ipcMain.handle(IPC_CHANNELS.HISTORY_OPEN, () => {
    createHistoryWindow()
  })
}
```

**Step 5: 更新 preload.ts**

修改 `main/preload.ts`：

```typescript
history: {
  open: () => ipcRenderer.invoke(IPC_CHANNELS.HISTORY_OPEN),
},
```

**Step 6: 在 main.ts 註冊 handler**

修改 `main/main.ts`，新增：

```typescript
import { registerHistoryHandlers } from './historyWindow'

// 在 app.whenReady() 中
registerHistoryHandlers()
```

**Step 7: 執行測試確認通過**

Run: `pnpm test -- historyWindow.test.ts`
Expected: PASS

**Step 8: Commit**

```bash
git add shared/types.ts main/historyWindow.ts main/__tests__/historyWindow.test.ts main/main.ts main/preload.ts
git commit -m "feat(electron): 新增 history:open IPC 支援開啟歷史視窗"
```

---

## Task 8: 新增歷史記錄頁面（Renderer 側）

**Files:**
- Create: `renderer/src/pages/History.tsx`
- Create: `renderer/src/pages/__tests__/History.test.tsx`
- Create: `renderer/history.html`
- Create: `renderer/src/history-entry.tsx`
- Modify: `renderer/vite.config.ts`

**Step 1: 建立測試**

建立 `renderer/src/pages/__tests__/History.test.tsx`：

```typescript
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { History } from '../History'

const mockTasks = [
  { id: '1', name: '今天任務', duration: 300000, actualTime: 300000, createdAt: Date.now() },
  { id: '2', name: '昨天任務', duration: 600000, actualTime: 600000, createdAt: Date.now() - 86400000 },
]

vi.mock('../../../../shared/types', async () => {
  const actual = await vi.importActual('../../../../shared/types')
  return { ...actual }
})

describe('History', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.electronAPI = {
      task: {
        getAll: vi.fn().mockResolvedValue(mockTasks),
        update: vi.fn(),
        delete: vi.fn(),
      },
    } as any
  })

  it('應該按日期分組顯示任務', async () => {
    render(<History />)

    await waitFor(() => {
      expect(screen.getByText(/今天/)).toBeInTheDocument()
      expect(screen.getByText(/昨天/)).toBeInTheDocument()
    })
  })

  it('預設展開今天的任務', async () => {
    render(<History />)

    await waitFor(() => {
      expect(screen.getByText('今天任務')).toBeVisible()
    })
  })

  it('點擊日期標題應該展開/收合', async () => {
    const user = userEvent.setup()
    render(<History />)

    await waitFor(() => {
      expect(screen.getByText('昨天任務')).toBeInTheDocument()
    })

    // 昨天預設收合，點擊展開
    await user.click(screen.getByText(/昨天/))
    expect(screen.getByText('昨天任務')).toBeVisible()
  })
})
```

**Step 2: 執行測試確認失敗**

Run: `cd renderer && pnpm test -- History.test.tsx`
Expected: FAIL - module not found

**Step 3: 實作 History 頁面**

建立 `renderer/src/pages/History.tsx`：

```typescript
import { useState, useEffect, useCallback } from 'react'
import type { TaskRecord } from '../../../shared/types'
import { formatTime } from '../../../shared/types'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronRight, Pencil, X } from 'lucide-react'

interface DateGroup {
  label: string
  date: string
  tasks: TaskRecord[]
}

function formatDateLabel(date: Date): string {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (date.toDateString() === today.toDateString()) return '今天'
  if (date.toDateString() === yesterday.toDateString()) return '昨天'
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

function groupByDate(tasks: TaskRecord[]): DateGroup[] {
  const groups = new Map<string, TaskRecord[]>()

  tasks.forEach((task) => {
    const date = new Date(task.createdAt)
    const key = date.toDateString()
    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key)!.push(task)
  })

  return Array.from(groups.entries())
    .map(([dateStr, tasks]) => ({
      label: formatDateLabel(new Date(dateStr)),
      date: dateStr,
      tasks: tasks.sort((a, b) => b.createdAt - a.createdAt),
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function History() {
  const [tasks, setTasks] = useState<TaskRecord[]>([])
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadTasks = useCallback(async () => {
    const api = window.electronAPI?.task
    if (api) {
      const allTasks = await api.getAll()
      setTasks(allTasks)
      // 預設展開今天
      const today = new Date().toDateString()
      setExpandedDates(new Set([today]))
    }
  }, [])

  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  const groups = groupByDate(tasks)

  const toggleDate = useCallback((date: string) => {
    setExpandedDates((prev) => {
      const next = new Set(prev)
      if (next.has(date)) {
        next.delete(date)
      } else {
        next.add(date)
      }
      return next
    })
  }, [])

  const handleEdit = useCallback((task: TaskRecord) => {
    setEditingId(task.id)
    setEditValue(task.name)
    setDeletingId(null)
  }, [])

  const handleEditSubmit = useCallback(async () => {
    if (editingId && editValue.trim()) {
      await window.electronAPI?.task?.update({ id: editingId, name: editValue.trim() })
      await loadTasks()
    }
    setEditingId(null)
  }, [editingId, editValue, loadTasks])

  const handleDelete = useCallback((id: string) => {
    setDeletingId(id)
    setEditingId(null)
  }, [])

  const handleDeleteConfirm = useCallback(async () => {
    if (deletingId) {
      await window.electronAPI?.task?.delete(deletingId)
      await loadTasks()
    }
    setDeletingId(null)
  }, [deletingId, loadTasks])

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-4 border-b">
        <h1 className="text-lg font-semibold">歷史記錄</h1>
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-2">
        {groups.map((group) => (
          <div key={group.date}>
            <button
              onClick={() => toggleDate(group.date)}
              className="flex items-center gap-2 w-full py-2 text-left font-medium hover:bg-muted/50 rounded"
            >
              {expandedDates.has(group.date) ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              {group.label} ({group.tasks.length})
            </button>

            {expandedDates.has(group.date) && (
              <ul className="ml-6 space-y-1">
                {group.tasks.map((task) => (
                  <li
                    key={task.id}
                    className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-muted/50 text-sm"
                  >
                    {deletingId === task.id ? (
                      <div className="flex-1 flex items-center justify-between">
                        <span>{task.name}</span>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() => setDeletingId(null)}
                          >
                            取消
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={handleDeleteConfirm}
                          >
                            確認刪除
                          </Button>
                        </div>
                      </div>
                    ) : editingId === task.id ? (
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleEditSubmit()
                          if (e.key === 'Escape') setEditingId(null)
                        }}
                        onBlur={handleEditSubmit}
                        autoFocus
                        className="flex-1 bg-transparent border-b border-blue-500 outline-none"
                      />
                    ) : (
                      <>
                        <span className="flex-1 truncate">{task.name}</span>
                        <span className="text-muted-foreground tabular-nums">
                          {formatTime(task.duration)}
                        </span>
                        <button
                          onClick={() => handleEdit(task)}
                          className="text-muted-foreground hover:text-blue-600"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(task.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
```

**Step 4: 建立 history entry 和 html**

建立 `renderer/src/history-entry.tsx`：

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import { History } from './pages/History'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <History />
  </React.StrictMode>
)
```

建立 `renderer/history.html`：

```html
<!DOCTYPE html>
<html lang="zh-TW">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>歷史記錄</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/history-entry.tsx"></script>
  </body>
</html>
```

**Step 5: 更新 vite.config.ts 支援多入口**

修改 `renderer/vite.config.ts`，新增 build.rollupOptions.input：

```typescript
build: {
  rollupOptions: {
    input: {
      main: resolve(__dirname, 'index.html'),
      history: resolve(__dirname, 'history.html'),
    },
  },
},
```

**Step 6: 執行測試確認通過**

Run: `cd renderer && pnpm test -- History.test.tsx`
Expected: PASS

**Step 7: Commit**

```bash
git add renderer/src/pages/History.tsx renderer/src/pages/__tests__/History.test.tsx renderer/history.html renderer/src/history-entry.tsx renderer/vite.config.ts
git commit -m "feat(history): 新增歷史記錄獨立視窗頁面"
```

---

## Task 9: 清理不再使用的檔案

**Files:**
- Delete: `renderer/src/components/Timer/TimeInput.tsx`
- Delete: `renderer/src/components/Timer/__tests__/TimeInput.test.tsx`
- Delete: `renderer/src/components/Timer/ModeSelector.tsx`
- Delete: `renderer/src/components/Timer/__tests__/ModeSelector.test.tsx`
- Delete: `renderer/src/components/Task/TaskHistory.tsx`
- Delete: `renderer/src/components/Task/__tests__/TaskHistory.test.tsx`

**Step 1: 確認沒有其他檔案引用這些模組**

Run: `grep -r "TimeInput\|ModeSelector\|TaskHistory" renderer/src --include="*.tsx" --include="*.ts"`

**Step 2: 刪除檔案**

```bash
rm renderer/src/components/Timer/TimeInput.tsx
rm renderer/src/components/Timer/__tests__/TimeInput.test.tsx
rm renderer/src/components/Timer/ModeSelector.tsx
rm renderer/src/components/Timer/__tests__/ModeSelector.test.tsx
rm renderer/src/components/Task/TaskHistory.tsx
rm renderer/src/components/Task/__tests__/TaskHistory.test.tsx
```

**Step 3: 執行全部測試確認無破壞**

Run: `pnpm test && cd renderer && pnpm test`
Expected: All tests PASS

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: 移除不再使用的 TimeInput, ModeSelector, TaskHistory"
```

---

## Task 10: 全面驗證與最終提交

**Step 1: 執行所有測試**

Run: `pnpm test && cd renderer && pnpm test`
Expected: All PASS

**Step 2: 執行 lint**

Run: `pnpm lint`
Expected: No errors

**Step 3: 手動測試開發模式**

Run: `pnpm dev`
驗證項目：
- [ ] 計時器和今日記錄同時顯示
- [ ] 點擊時間可輸入
- [ ] 預設按鈕點擊直接開始
- [ ] 今日記錄最多 3 筆
- [ ] 編輯任務名稱正常
- [ ] 刪除確認機制正常
- [ ] 點擊查看全部開啟歷史視窗
- [ ] 歷史視窗按日期分組
- [ ] 歷史視窗編輯/刪除正常

**Step 4: 最終 Commit**

```bash
git add -A
git commit -m "feat: UI/UX 優化完成 - 單頁整合設計"
```

---

## 執行摘要

| Task | 說明 | 預估時間 |
|------|------|----------|
| 1 | PresetButtons 縮小一行排列 | 5 min |
| 2 | TimerDisplay 點擊編輯 | 10 min |
| 3 | Timer 整合新設計 | 10 min |
| 4 | task:update IPC | 10 min |
| 5 | TodayTasks 元件 | 15 min |
| 6 | App.tsx 新佈局 | 10 min |
| 7 | history:open IPC | 10 min |
| 8 | History 頁面 | 15 min |
| 9 | 清理舊檔案 | 5 min |
| 10 | 全面驗證 | 10 min |

**總計：約 100 分鐘**
