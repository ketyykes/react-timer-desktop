# PRP: P3 - 計時器核心邏輯

## 概述
實作計時器核心邏輯，包含主程序端的 TimerService 和渲染程序端的 useTimer hook，透過 IPC 進行通訊。

## 驗收標準 (Acceptance Criteria)

### AC1: 共用型別定義
- [x] 建立 `shared/types.ts` 定義計時器狀態和事件型別
- [x] 定義 TimerState: 'idle' | 'running' | 'paused' | 'overtime'
- [x] 定義 TimerEvent 型別用於 IPC 通訊

### AC2: TimerService（主程序端）
- [x] 實作 TimerService 類別處理計時器邏輯
- [x] 支援 start(duration)、pause()、resume()、stop()、reset() 操作
- [x] 時間到達後自動切換到 overtime 模式並繼續計時
- [x] 每秒發送 tick 事件更新剩餘時間
- [ ] 整合 TrayManager 更新狀態列顯示（將在 P4 UI 整合時完成）

### AC3: IPC 通訊
- [x] 定義 IPC channels: timer:start, timer:pause, timer:resume, timer:stop
- [x] 主程序監聽渲染程序的控制命令
- [x] 主程序向渲染程序發送 tick 和狀態更新事件

### AC4: useTimer Hook（渲染程序端）
- [x] 實作 useTimer hook 提供計時器狀態和控制方法
- [x] 回傳 { state, remaining, elapsed, start, pause, resume, stop }
- [x] 處理 IPC 事件更新狀態

## 測試案例清單

### TimerService Unit Tests
1. `start(duration)` - 應開始倒數計時
2. `pause()` - 應暫停計時
3. `resume()` - 應繼續計時
4. `stop()` - 應停止並重置計時器
5. 時間到達時應切換到 overtime 狀態
6. overtime 模式下應繼續計時（正向）

### IPC Integration Tests
1. 渲染程序發送 timer:start 應啟動計時器
2. 主程序應每秒發送 tick 事件
3. 狀態變更應正確同步

### useTimer Hook Tests
1. 初始狀態應為 idle
2. start 後狀態應為 running
3. 收到 tick 事件應更新 remaining

## 檔案結構

```
shared/
└── types.ts              # 共用型別定義

main/
├── timer/
│   ├── TimerService.ts   # 計時器服務
│   └── __tests__/
│       └── TimerService.test.ts
└── ipc/
    └── timerHandlers.ts  # IPC 事件處理

renderer/src/
└── hooks/
    ├── useTimer.ts       # 計時器 hook
    └── __tests__/
        └── useTimer.test.ts
```

## 技術決策

- **計時器實作**: 使用 setInterval 配合 Date.now() 確保精確度
- **狀態管理**: 主程序為單一事實來源，渲染程序透過 IPC 同步
- **Overtime 模式**: 時間到達後不停止，繼續計時並切換顯示模式

## 相依性

- 相依 P2（TrayManager）用於更新狀態列顯示
- P4（計時器 UI）將使用 useTimer hook

## 預估時間
1-2 個迭代週期

---
建立日期: 2025-01-15
完成日期: 2025-01-15
狀態: COMPLETED

## 測試覆蓋率
- main: 99.56% statements, 97.72% branches
- renderer: 100% statements, 100% branches, 100% functions
