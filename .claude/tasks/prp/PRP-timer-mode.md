# PRP: 計時模式功能 (Timer Mode)

## 功能概述

新增計時器模式選擇，支援：
- **倒數模式 (countdown)**: 從設定時間倒數到 0，超時後顯示負數
- **正數模式 (countup)**: 從 0 開始計時，到達設定時間後繼續計時

兩種模式在到達目標時間時都會觸發系統通知，並繼續計時。

---

## 驗收標準 (Acceptance Criteria)

### AC1: 模式選擇 UI
- [x] idle 狀態下顯示模式選擇器（toggle 按鈕切換倒數/正數）
- [x] 選中的模式有視覺區分（顯示對應圖示和文字）
- [x] 計時中隱藏模式選擇器
- [x] 預設選中「倒數」模式

### AC2: 倒數模式行為
- [x] 顯示剩餘時間（從 duration 倒數）
- [x] 到達 0 時觸發通知
- [x] 超時後顯示負數格式 `-MM:SS`
- [x] 超時時文字變紅色

### AC3: 正數模式行為
- [x] 顯示已經過時間（從 0 開始）
- [x] 到達目標時間時觸發通知
- [x] 超時後顯示 `+MM:SS` 格式
- [x] 超時時文字變紅色

### AC4: Tray 標題同步
- [x] 倒數模式：顯示剩餘時間
- [x] 正數模式：顯示已經過時間
- [x] 超時時顯示對應的正負號

### AC5: 通知訊息
- [x] 倒數模式：「5:00 時間到！」
- [x] 正數模式：「已計時 5:00！」

---

## 測試案例清單

### TimerService 測試
- [x] 預設應為 countdown 模式
- [x] 倒數模式下 displayTime 應等於 remaining
- [x] 正數模式下 displayTime 應等於 elapsed
- [x] 正數模式超時時應觸發 onComplete（只一次）
- [x] start 時應能指定模式

### ModeSelector 測試
- [x] 應顯示當前模式（toggle 按鈕）
- [x] 選中的模式應有不同樣式（圖示+文字）
- [x] 點擊應觸發 onChange（切換模式）
- [x] disabled 時不應響應點擊

### TimerDisplay 測試
- [x] 倒數模式超時時應顯示負數格式
- [x] 正數模式超時時應顯示 +MM:SS 格式
- [x] 超時時應顯示紅色

### Timer 整合測試
- [x] idle 狀態下應顯示模式選擇器
- [x] 計時中不應顯示模式選擇器
- [x] 開始計時應傳遞選中的模式

---

## 技術設計

### 型別變更 (shared/types.ts)

```typescript
// 新增
export type TimerMode = 'countdown' | 'countup'

// 擴充 TimerData
export interface TimerData {
  state: TimerState
  mode: TimerMode           // 新增
  duration: number
  remaining: number
  elapsed: number
  isOvertime: boolean
  displayTime: number       // 新增
}
```

### 核心邏輯 (TimerService)

```typescript
// start() 新增 mode 參數
start(duration: number, mode: TimerMode = 'countdown'): void

// getData() 根據 mode 計算 displayTime
getData(): TimerData {
  const displayTime = this.mode === 'countdown'
    ? remaining
    : elapsed
  // ...
}
```

### UI 元件

- 新增 `ModeSelector.tsx` - 模式選擇按鈕
- 修改 `TimerDisplay.tsx` - 支援模式顯示
- 修改 `Timer.tsx` - 整合模式選擇

---

## 實作步驟 (TDD)

### Phase 1: 核心型別與邏輯

| Step | 檔案 | 任務 |
|------|------|------|
| 1 | `shared/types.ts` | 新增 TimerMode，擴充 TimerData |
| 2 | `main/timer/TimerService.ts` | 新增 mode 支援 |
| 3 | `main/timer/__tests__/TimerService.test.ts` | 更新測試 |

### Phase 2: IPC 層

| Step | 檔案 | 任務 |
|------|------|------|
| 4 | `main/ipc/timerHandlers.ts` | TIMER_START 傳遞 mode |
| 5 | `main/preload.ts` | 更新 API 型別 |
| 6 | `main/ipc/__tests__/timerHandlers.test.ts` | 更新測試 |

### Phase 3: React Hook

| Step | 檔案 | 任務 |
|------|------|------|
| 7 | `renderer/src/hooks/useTimer.ts` | 新增 mode 支援 |
| 8 | `renderer/src/hooks/__tests__/useTimer.test.ts` | 更新測試 |

### Phase 4: UI 元件

| Step | 檔案 | 任務 |
|------|------|------|
| 9 | `renderer/src/components/Timer/ModeSelector.tsx` | 新建元件 |
| 10 | `renderer/src/components/Timer/__tests__/ModeSelector.test.tsx` | 新建測試 |
| 11 | `renderer/src/components/Timer/TimerDisplay.tsx` | 修改支援 mode |
| 12 | `renderer/src/components/Timer/Timer.tsx` | 整合 ModeSelector |

### Phase 5: 整合

| Step | 檔案 | 任務 |
|------|------|------|
| 13 | `main/main.ts` | 更新 Tray 標題邏輯 |
| 14 | `main/notification/NotificationService.ts` | 模式感知通知 |

---

## 關鍵檔案清單

| 檔案 | 操作 |
|------|------|
| `shared/types.ts` | 修改 |
| `main/timer/TimerService.ts` | 修改 |
| `main/timer/__tests__/TimerService.test.ts` | 修改 |
| `main/ipc/timerHandlers.ts` | 修改 |
| `main/preload.ts` | 修改 |
| `renderer/src/hooks/useTimer.ts` | 修改 |
| `renderer/src/components/Timer/ModeSelector.tsx` | 新增 |
| `renderer/src/components/Timer/__tests__/ModeSelector.test.tsx` | 新增 |
| `renderer/src/components/Timer/TimerDisplay.tsx` | 修改 |
| `renderer/src/components/Timer/Timer.tsx` | 修改 |
| `main/main.ts` | 修改 |
| `main/notification/NotificationService.ts` | 修改 |

---

## 驗證方式

```bash
# 1. 執行所有測試
pnpm test

# 2. 檢查覆蓋率
pnpm test:coverage

# 3. Lint 檢查
pnpm lint

# 4. 手動測試
pnpm dev
```

### 手動測試項目

1. 選擇「倒數」模式，設定 10 秒
   - 驗證顯示從 00:10 倒數
   - 驗證到 0 時跳通知
   - 驗證超時後顯示 -00:01, -00:02...

2. 選擇「正數」模式，設定 10 秒
   - 驗證顯示從 00:00 開始
   - 驗證到 00:10 時跳通知
   - 驗證超時後顯示 +00:11, +00:12...

3. 驗證 Tray 標題同步顯示

---

## 完成條件

- [x] 所有測試通過（Main: 181, Renderer: 91）
- [x] 測試覆蓋率 ≥ 95%
- [x] `pnpm lint` 無錯誤
- [x] AC1-AC5 全部驗收通過
