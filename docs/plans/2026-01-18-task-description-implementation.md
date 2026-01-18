# 任務描述與 UI 整合實作計畫

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 實作計時前任務描述輸入、TaskDialog/TaskHistory 整合、Tab 切換、預設時間調整

**Architecture:** 在 Timer.tsx 新增 taskDescription state，透過 props 傳遞給 App.tsx 管理的 TaskDialog。App.tsx 使用 Tabs 元件切換計時器與歷史記錄視圖。

**Tech Stack:** React 19, TypeScript, Vitest, @testing-library/react, shadcn/ui

---

## Task 1: 安裝 shadcn/ui Tabs 元件

**Files:**
- Create: `renderer/src/components/ui/tabs.tsx`

**Step 1: 安裝 Tabs 元件**

Run:
```bash
cd renderer && pnpm dlx shadcn@latest add tabs
```

Expected: 新增 `renderer/src/components/ui/tabs.tsx`

**Step 2: 驗證安裝**

Run:
```bash
ls renderer/src/components/ui/tabs.tsx
```

Expected: 檔案存在

**Step 3: Commit**

```bash
git add renderer/src/components/ui/tabs.tsx
git commit -m "chore: 安裝 shadcn/ui tabs 元件"
```

---

## Task 2: 修改 PresetButtons 預設時間

**Files:**
- Modify: `renderer/src/components/Timer/PresetButtons.tsx:10-15`
- Test: `renderer/src/components/Timer/__tests__/PresetButtons.test.tsx`

**Step 1: 更新測試預期值**

修改 `renderer/src/components/Timer/__tests__/PresetButtons.test.tsx`，將預設時間改為 5/10/25/45 分鐘：

```typescript
// 找到測試中的預期值，改為：
const expectedPresets = [
  { label: '5 分鐘', ms: 5 * 60 * 1000 },
  { label: '10 分鐘', ms: 10 * 60 * 1000 },
  { label: '25 分鐘', ms: 25 * 60 * 1000 },
  { label: '45 分鐘', ms: 45 * 60 * 1000 },
]
```

**Step 2: 執行測試確認失敗**

Run:
```bash
cd renderer && pnpm test -- PresetButtons --run
```

Expected: FAIL（預期值與實際值不符）

**Step 3: 修改 PresetButtons.tsx**

將 `PRESETS` 常數改為：

```typescript
const PRESETS = [
  { label: '5 分鐘', ms: 5 * 60 * 1000 },
  { label: '10 分鐘', ms: 10 * 60 * 1000 },
  { label: '25 分鐘', ms: 25 * 60 * 1000 },
  { label: '45 分鐘', ms: 45 * 60 * 1000 },
] as const
```

**Step 4: 執行測試確認通過**

Run:
```bash
cd renderer && pnpm test -- PresetButtons --run
```

Expected: PASS

**Step 5: Commit**

```bash
git add renderer/src/components/Timer/PresetButtons.tsx renderer/src/components/Timer/__tests__/PresetButtons.test.tsx
git commit -m "feat: 調整預設時間為 5/10/25/45 分鐘"
```

---

## Task 3: 建立 TaskDescriptionInput 元件

**Files:**
- Create: `renderer/src/components/Timer/TaskDescriptionInput.tsx`
- Create: `renderer/src/components/Timer/__tests__/TaskDescriptionInput.test.tsx`
- Modify: `renderer/src/components/Timer/index.ts`

**Step 1: 撰寫測試**

建立 `renderer/src/components/Timer/__tests__/TaskDescriptionInput.test.tsx`：

```typescript
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
```

**Step 2: 執行測試確認失敗**

Run:
```bash
cd renderer && pnpm test -- TaskDescriptionInput --run
```

Expected: FAIL（元件不存在）

**Step 3: 實作 TaskDescriptionInput 元件**

建立 `renderer/src/components/Timer/TaskDescriptionInput.tsx`：

```typescript
import { Input } from '@/components/ui/input'

export interface TaskDescriptionInputProps {
  /** 輸入值 */
  value: string
  /** 值變更時的回調 */
  onChange: (value: string) => void
  /** 是否禁用 */
  disabled: boolean
}

/**
 * 任務描述輸入元件
 * 用於計時前輸入任務目標（選填）
 */
export function TaskDescriptionInput({
  value,
  onChange,
  disabled,
}: TaskDescriptionInputProps) {
  return (
    <Input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      placeholder="這次要做什麼？（選填）"
      className="text-center"
    />
  )
}
```

**Step 4: 執行測試確認通過**

Run:
```bash
cd renderer && pnpm test -- TaskDescriptionInput --run
```

Expected: PASS

**Step 5: 更新 index.ts 匯出**

修改 `renderer/src/components/Timer/index.ts`，新增匯出：

```typescript
export { TaskDescriptionInput } from './TaskDescriptionInput'
export type { TaskDescriptionInputProps } from './TaskDescriptionInput'
```

**Step 6: Commit**

```bash
git add renderer/src/components/Timer/TaskDescriptionInput.tsx renderer/src/components/Timer/__tests__/TaskDescriptionInput.test.tsx renderer/src/components/Timer/index.ts
git commit -m "feat: 新增 TaskDescriptionInput 元件"
```

---

## Task 4: 修改 Timer.tsx 整合任務描述

**Files:**
- Modify: `renderer/src/components/Timer/Timer.tsx`
- Modify: `renderer/src/components/Timer/__tests__/Timer.test.tsx`

**Step 1: 更新測試**

在 `renderer/src/components/Timer/__tests__/Timer.test.tsx` 新增測試案例：

```typescript
describe('任務描述功能', () => {
  it('應顯示任務描述輸入框', () => {
    render(<Timer />)
    expect(screen.getByPlaceholderText('這次要做什麼？（選填）')).toBeInTheDocument()
  })

  it('計時中不應顯示任務描述輸入框', async () => {
    render(<Timer />)
    const presetButton = screen.getByText('5 分鐘')
    await userEvent.click(presetButton)
    expect(screen.queryByPlaceholderText('這次要做什麼？（選填）')).not.toBeInTheDocument()
  })
})
```

**Step 2: 執行測試確認失敗**

Run:
```bash
cd renderer && pnpm test -- Timer.test --run
```

Expected: FAIL（找不到任務描述輸入框）

**Step 3: 修改 Timer.tsx**

在 Timer.tsx 中：

1. 匯入 TaskDescriptionInput：
```typescript
import { TaskDescriptionInput } from './TaskDescriptionInput'
```

2. 新增 state：
```typescript
const [taskDescription, setTaskDescription] = useState('')
```

3. 在 TimeInput 和 PresetButtons 之間插入：
```typescript
<TaskDescriptionInput
  value={taskDescription}
  onChange={setTaskDescription}
  disabled={isActive || isStarting}
/>
```

**Step 4: 執行測試確認通過**

Run:
```bash
cd renderer && pnpm test -- Timer.test --run
```

Expected: PASS

**Step 5: Commit**

```bash
git add renderer/src/components/Timer/Timer.tsx renderer/src/components/Timer/__tests__/Timer.test.tsx
git commit -m "feat: Timer 整合任務描述輸入框"
```

---

## Task 5: 修改 TaskDialog 支援預填名稱

**Files:**
- Modify: `renderer/src/components/Task/TaskDialog.tsx`
- Modify: `renderer/src/components/Task/__tests__/TaskDialog.test.tsx`

**Step 1: 新增測試案例**

在 `renderer/src/components/Task/__tests__/TaskDialog.test.tsx` 新增：

```typescript
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
```

**Step 2: 執行測試確認失敗**

Run:
```bash
cd renderer && pnpm test -- TaskDialog --run
```

Expected: FAIL（defaultName prop 不存在）

**Step 3: 修改 TaskDialog.tsx**

1. 更新介面：
```typescript
export interface TaskDialogProps {
  open: boolean
  duration: number
  actualTime: number
  defaultName?: string  // 新增
  onConfirm: (name: string) => void
  onCancel: () => void
}
```

2. 使用 useEffect 同步 defaultName：
```typescript
import { useState, useCallback, useEffect } from 'react'

// 在元件內：
const [taskName, setTaskName] = useState(defaultName ?? '')

useEffect(() => {
  if (open) {
    setTaskName(defaultName ?? '')
  }
}, [open, defaultName])
```

**Step 4: 執行測試確認通過**

Run:
```bash
cd renderer && pnpm test -- TaskDialog --run
```

Expected: PASS

**Step 5: Commit**

```bash
git add renderer/src/components/Task/TaskDialog.tsx renderer/src/components/Task/__tests__/TaskDialog.test.tsx
git commit -m "feat: TaskDialog 支援 defaultName 預填功能"
```

---

## Task 6: 擴展 useTimer 暴露 subscribeComplete

**Files:**
- Modify: `renderer/src/hooks/useTimer.ts`
- Modify: `renderer/src/hooks/__tests__/useTimer.test.ts`

**Step 1: 新增測試案例**

在 `renderer/src/hooks/__tests__/useTimer.test.ts` 新增：

```typescript
describe('subscribeComplete', () => {
  it('應提供 subscribeComplete 方法', () => {
    const { result } = renderHook(() => useTimer())
    expect(typeof result.current.subscribeComplete).toBe('function')
  })

  it('subscribeComplete 應回傳取消訂閱函式', () => {
    const { result } = renderHook(() => useTimer())
    const unsubscribe = result.current.subscribeComplete(() => {})
    expect(typeof unsubscribe).toBe('function')
  })
})
```

**Step 2: 執行測試確認失敗**

Run:
```bash
cd renderer && pnpm test -- useTimer --run
```

Expected: FAIL（subscribeComplete 不存在）

**Step 3: 修改 useTimer.ts**

1. 更新 UseTimerReturn 介面：
```typescript
export interface UseTimerReturn {
  // ... 現有屬性
  /** 訂閱計時完成事件 */
  subscribeComplete: (callback: (data: { duration: number; actualElapsed: number; mode: TimerMode }) => void) => () => void
}
```

2. 實作 subscribeComplete：
```typescript
const subscribeComplete = useCallback(
  (callback: (data: { duration: number; actualElapsed: number; mode: TimerMode }) => void): (() => void) => {
    const api = getTimerAPI()
    if (!api) return () => {}
    return api.onComplete(callback)
  },
  [getTimerAPI]
)

// 在 return 中加入：
return {
  // ... 現有屬性
  subscribeComplete,
}
```

**Step 4: 執行測試確認通過**

Run:
```bash
cd renderer && pnpm test -- useTimer --run
```

Expected: PASS

**Step 5: Commit**

```bash
git add renderer/src/hooks/useTimer.ts renderer/src/hooks/__tests__/useTimer.test.ts
git commit -m "feat: useTimer 新增 subscribeComplete 方法"
```

---

## Task 7: 重構 App.tsx 整合所有功能

**Files:**
- Modify: `renderer/src/App.tsx`
- Create: `renderer/src/__tests__/App.test.tsx`

**Step 1: 建立 App 測試檔案**

建立 `renderer/src/__tests__/App.test.tsx`：

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'

// Mock useTimer
vi.mock('@/hooks/useTimer', () => ({
  useTimer: () => ({
    state: 'idle',
    mode: 'countdown',
    displayTime: 0,
    duration: 0,
    elapsed: 0,
    remaining: 0,
    isOvertime: false,
    start: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    stop: vi.fn(),
    reset: vi.fn(),
    subscribeComplete: vi.fn(() => () => {}),
  }),
}))

// Mock electronAPI
beforeEach(() => {
  window.electronAPI = {
    timer: {
      start: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      stop: vi.fn(),
      reset: vi.fn(),
      onTick: vi.fn(() => () => {}),
      onStateChange: vi.fn(() => () => {}),
      onComplete: vi.fn(() => () => {}),
    },
    task: {
      save: vi.fn(),
      getAll: vi.fn().mockResolvedValue([]),
      delete: vi.fn(),
    },
  } as any
})

describe('App', () => {
  describe('Tab 切換', () => {
    it('應顯示計時器和歷史記錄兩個 Tab', () => {
      render(<App />)
      expect(screen.getByRole('tab', { name: '計時器' })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: '歷史記錄' })).toBeInTheDocument()
    })

    it('預設顯示計時器 Tab', () => {
      render(<App />)
      expect(screen.getByRole('tab', { name: '計時器' })).toHaveAttribute('aria-selected', 'true')
    })

    it('點擊歷史記錄 Tab 應切換內容', async () => {
      render(<App />)
      const historyTab = screen.getByRole('tab', { name: '歷史記錄' })
      await userEvent.click(historyTab)
      expect(screen.getByText('任務歷史')).toBeInTheDocument()
    })
  })
})
```

**Step 2: 執行測試確認失敗**

Run:
```bash
cd renderer && pnpm test -- App.test --run
```

Expected: FAIL（找不到 Tab）

**Step 3: 重構 App.tsx**

```typescript
import { useState, useEffect, useCallback } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Timer } from '@/components/Timer'
import { TaskDialog } from '@/components/Task/TaskDialog'
import { TaskHistory } from '@/components/Task/TaskHistory'
import type { TaskRecord, TimerMode } from '../../shared/types'

const App = () => {
  // Tab 狀態
  const [activeTab, setActiveTab] = useState<'timer' | 'history'>('timer')

  // TaskDialog 狀態
  const [taskDialogOpen, setTaskDialogOpen] = useState(false)
  const [completedTask, setCompletedTask] = useState<{
    duration: number
    actualTime: number
    description: string
  } | null>(null)

  // 任務歷史
  const [tasks, setTasks] = useState<TaskRecord[]>([])

  // 任務描述（從 Timer 傳上來）
  const [taskDescription, setTaskDescription] = useState('')

  // 載入任務歷史
  const loadTasks = useCallback(async () => {
    const api = window.electronAPI?.task
    if (api) {
      const allTasks = await api.getAll()
      setTasks(allTasks)
    }
  }, [])

  // 切換到歷史記錄時載入
  useEffect(() => {
    if (activeTab === 'history') {
      loadTasks()
    }
  }, [activeTab, loadTasks])

  // 處理計時完成
  const handleTimerComplete = useCallback((data: { duration: number; actualElapsed: number; mode: TimerMode }) => {
    setCompletedTask({
      duration: data.duration,
      actualTime: data.actualElapsed,
      description: taskDescription,
    })
    setTaskDialogOpen(true)
  }, [taskDescription])

  // 處理任務儲存
  const handleTaskConfirm = useCallback(async (name: string) => {
    if (completedTask) {
      const api = window.electronAPI?.task
      if (api) {
        await api.save({
          name: name || '未命名任務',
          duration: completedTask.duration,
          actualTime: completedTask.actualTime,
        })
      }
    }
    setTaskDialogOpen(false)
    setCompletedTask(null)
    setTaskDescription('')
  }, [completedTask])

  // 處理取消/跳過
  const handleTaskCancel = useCallback(() => {
    setTaskDialogOpen(false)
    setCompletedTask(null)
    setTaskDescription('')
  }, [])

  // 處理刪除任務
  const handleTaskDelete = useCallback(async (id: string) => {
    const api = window.electronAPI?.task
    if (api) {
      await api.delete(id)
      await loadTasks()
    }
  }, [loadTasks])

  return (
    <div className="h-full bg-white flex flex-col p-4">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'timer' | 'history')} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="timer">計時器</TabsTrigger>
          <TabsTrigger value="history">歷史記錄</TabsTrigger>
        </TabsList>

        <TabsContent value="timer" className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-xs">
            <Timer
              taskDescription={taskDescription}
              onTaskDescriptionChange={setTaskDescription}
              onComplete={handleTimerComplete}
            />
          </div>
        </TabsContent>

        <TabsContent value="history" className="flex-1 overflow-auto">
          <TaskHistory tasks={tasks} onDelete={handleTaskDelete} />
        </TabsContent>
      </Tabs>

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

Run:
```bash
cd renderer && pnpm test -- App.test --run
```

Expected: PASS

**Step 5: Commit**

```bash
git add renderer/src/App.tsx renderer/src/__tests__/App.test.tsx
git commit -m "feat: App 整合 Tabs、TaskDialog、TaskHistory"
```

---

## Task 8: 更新 Timer.tsx 支援外部控制

**Files:**
- Modify: `renderer/src/components/Timer/Timer.tsx`
- Modify: `renderer/src/components/Timer/__tests__/Timer.test.tsx`

**Step 1: 更新 Timer 介面**

Timer 需要接收來自 App 的 props：

```typescript
export interface TimerProps {
  taskDescription: string
  onTaskDescriptionChange: (value: string) => void
  onComplete: (data: { duration: number; actualElapsed: number; mode: TimerMode }) => void
}
```

**Step 2: 修改 Timer.tsx**

1. 移除內部 taskDescription state
2. 使用 props 傳入的 taskDescription 和 onTaskDescriptionChange
3. 使用 useEffect 訂閱 onComplete 事件

**Step 3: 更新測試**

更新 `Timer.test.tsx` 使用新的 props 介面

**Step 4: 執行測試確認通過**

Run:
```bash
cd renderer && pnpm test -- Timer.test --run
```

Expected: PASS

**Step 5: Commit**

```bash
git add renderer/src/components/Timer/Timer.tsx renderer/src/components/Timer/__tests__/Timer.test.tsx
git commit -m "feat: Timer 支援外部控制任務描述和完成回調"
```

---

## Task 9: 全專案測試與修正

**Step 1: 執行所有 renderer 測試**

Run:
```bash
cd renderer && pnpm test --run
```

Expected: 所有測試通過

**Step 2: 執行 lint**

Run:
```bash
pnpm lint
```

Expected: 無錯誤

**Step 3: 執行 typecheck**

Run:
```bash
pnpm run build
```

Expected: 建置成功

**Step 4: 手動測試**

Run:
```bash
pnpm dev
```

驗證項目：
- [ ] 任務描述輸入框顯示正確
- [ ] 預設按鈕顯示 5/10/25/45 分鐘
- [ ] Tab 切換正常
- [ ] 計時完成後 TaskDialog 彈出並預填描述
- [ ] 儲存後任務出現在歷史記錄
- [ ] 可刪除歷史記錄

**Step 5: Final Commit**

```bash
git add -A
git commit -m "feat: 完成任務描述與 UI 整合功能"
```

---

## 執行摘要

| Task | 說明 | 預估時間 |
|------|------|----------|
| 1 | 安裝 Tabs 元件 | 2 min |
| 2 | 修改 PresetButtons | 5 min |
| 3 | 建立 TaskDescriptionInput | 10 min |
| 4 | Timer 整合任務描述 | 10 min |
| 5 | TaskDialog 預填功能 | 10 min |
| 6 | useTimer 暴露 subscribeComplete | 10 min |
| 7 | App.tsx 整合 | 15 min |
| 8 | Timer 外部控制 | 10 min |
| 9 | 全專案測試 | 10 min |

**總計：約 80 分鐘**
