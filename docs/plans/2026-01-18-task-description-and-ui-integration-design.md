# 任務描述與 UI 整合設計

## 概述

本次更新包含四項功能：
1. 計時前輸入任務描述（選填）
2. TaskDialog 整合（停止後彈出，預填描述）
3. TaskHistory 整合（Tab 切換顯示）
4. 預設時間調整（5/10/25/45 分鐘）

## UI 結構

```
App.tsx
├── Tabs (計時器 | 歷史記錄)
│   ├── [計時器 Tab]
│   │   └── Timer
│   │       ├── TimerDisplay
│   │       ├── TimeInput
│   │       ├── TaskDescriptionInput  ← 新增
│   │       ├── PresetButtons (5/10/25/45)
│   │       ├── ModeSelector + 開始按鈕
│   │       └── TimerControls
│   │
│   └── [歷史記錄 Tab]
│       └── TaskHistory
│
└── TaskDialog (彈出層)
```

## 資料流

### 計時流程

1. 用戶輸入時間 + 任務描述（選填）
2. 點擊「開始」或預設按鈕
3. 計時中（taskDescription 保留在 state）
4. 用戶點擊「停止」
5. 彈出 TaskDialog，預填 taskDescription
6. 用戶確認/修改後儲存
7. 清空 taskDescription，回到 idle

### 狀態管理

**Timer.tsx 新增狀態：**
- `taskDescription: string` - 計時前輸入的任務描述

**App.tsx 新增狀態：**
- `activeTab: 'timer' | 'history'` - 當前分頁
- `taskDialogOpen: boolean` - 對話框開關
- `completedTask: { duration, actualTime, description } | null` - 完成的任務資料
- `tasks: TaskRecord[]` - 任務歷史列表

### TaskRecord 結構（不變）

```typescript
interface TaskRecord {
  id: string
  name: string        // 來自 TaskDialog 的最終名稱
  duration: number    // 設定時間（毫秒）
  actualTime: number  // 實際時間（毫秒）
  createdAt: number   // 建立時間戳
}
```

## 元件設計

### TaskDescriptionInput（新增）

```typescript
interface TaskDescriptionInputProps {
  value: string
  onChange: (value: string) => void
  disabled: boolean
}
```

- 單行 `<Input>` 元件
- placeholder: `這次要做什麼？（選填）`
- 位置：TimeInput 下方、PresetButtons 上方

### PresetButtons（修改）

預設時間從 `5/15/25/30` 改為 `5/10/25/45` 分鐘：
- 5 分鐘：短休息
- 10 分鐘：中休息
- 25 分鐘：番茄鐘
- 45 分鐘：長專注

### TaskDialog（修改）

新增 `defaultName` prop，用於預填計時前的任務描述：

```typescript
interface TaskDialogProps {
  open: boolean
  duration: number
  actualTime: number
  defaultName?: string  // 新增：預填的任務名稱
  onConfirm: (name: string) => void
  onCancel: () => void
}
```

### useTimer（修改）

暴露 `onComplete` 訂閱方法給外部使用，讓 App.tsx 可以監聽計時完成事件。

## 互動細節

| 情境 | 行為 |
|------|------|
| 預設按鈕點擊 | 直接開始計時（使用當前 taskDescription） |
| TaskDialog 跳過 | 不儲存任務，直接關閉 |
| 切換到歷史 Tab | 自動載入最新任務列表 |
| 計時中切換 Tab | 允許，計時繼續在背景運行 |

## 需要修改的檔案

| 檔案 | 變更內容 |
|------|----------|
| `renderer/src/components/Timer/Timer.tsx` | 加入 taskDescription state 和輸入框 |
| `renderer/src/components/Timer/TaskDescriptionInput.tsx` | 新增元件 |
| `renderer/src/components/Timer/PresetButtons.tsx` | 改預設值為 5/10/25/45 |
| `renderer/src/components/Task/TaskDialog.tsx` | 加入 defaultName prop |
| `renderer/src/App.tsx` | 加入 Tabs、整合 TaskDialog 和 TaskHistory |
| `renderer/src/hooks/useTimer.ts` | 暴露 onComplete 回呼給外部使用 |

## 測試考量

- TaskDescriptionInput 元件測試
- TaskDialog 預填功能測試
- Tab 切換功能測試
- 完整計時流程整合測試
