# PRP: P4 計時器 UI

## 功能概述

實作計時器的使用者介面，包含時間設定、計時顯示、控制按鈕，以及超時狀態的視覺提示。

## 驗收標準 (Acceptance Criteria)

### AC1: 時間設定介面
- [ ] 使用者可輸入時間（支援 MM:SS 格式）
- [ ] 提供預設時間按鈕（5分鐘、15分鐘、25分鐘、30分鐘）
- [ ] 輸入驗證：無效格式顯示錯誤提示

### AC2: 計時器顯示畫面
- [ ] 顯示剩餘時間（MM:SS 格式）
- [ ] 超時模式顯示負數時間（-MM:SS）
- [ ] 顯示目前狀態（idle/running/paused/overtime）

### AC3: 控制按鈕
- [ ] 開始按鈕：idle 狀態時可用
- [ ] 暫停/繼續按鈕：running 狀態顯示暫停，paused 狀態顯示繼續
- [ ] 停止按鈕：running/paused/overtime 狀態時可用
- [ ] 重置按鈕：任何非 idle 狀態時可用

### AC4: 超時視覺提示
- [ ] 進入 overtime 狀態時，時間顯示變為紅色
- [ ] overtime 狀態時，背景顏色變化提示

## 元件規劃

```
renderer/src/
├── components/
│   ├── Timer/
│   │   ├── Timer.tsx           # 主計時器元件
│   │   ├── TimerDisplay.tsx    # 時間顯示
│   │   ├── TimerControls.tsx   # 控制按鈕
│   │   ├── TimeInput.tsx       # 時間輸入
│   │   ├── PresetButtons.tsx   # 預設時間按鈕
│   │   └── __tests__/
│   │       ├── Timer.test.tsx
│   │       ├── TimerDisplay.test.tsx
│   │       ├── TimerControls.test.tsx
│   │       ├── TimeInput.test.tsx
│   │       └── PresetButtons.test.tsx
```

## 測試案例清單

### TimerDisplay
- [ ] 顯示格式化的剩餘時間
- [ ] 超時時顯示負數時間
- [ ] 超時時套用 overtime 樣式

### TimerControls
- [ ] idle 狀態顯示開始按鈕
- [ ] running 狀態顯示暫停和停止按鈕
- [ ] paused 狀態顯示繼續和停止按鈕
- [ ] overtime 狀態顯示停止按鈕
- [ ] 各按鈕點擊觸發對應 callback

### TimeInput
- [ ] 可輸入時間字串
- [ ] 驗證有效的時間格式
- [ ] 無效格式顯示錯誤訊息
- [ ] 按 Enter 送出時間

### PresetButtons
- [ ] 顯示預設時間選項
- [ ] 點擊後觸發 onSelect callback 並傳入毫秒值

### Timer (整合)
- [ ] 整合所有子元件
- [ ] 使用 useTimer hook 管理狀態
- [ ] 狀態切換時 UI 正確更新

## 技術規格

- **樣式**: Tailwind CSS 4 + shadcn/ui
- **測試**: Vitest + React Testing Library
- **覆蓋率**: ≥ 95%
