# Product Backlog - Mac 狀態列計時器

## 專案目標
Mac 狀態列計時器應用，可設定倒數時間，時間到時提醒但繼續計時，停止後可記錄任務名稱。

## 狀態標籤
- `[BACKLOG]` 待處理
- `[IN_PROGRESS]` 進行中
- `[COMPLETED]` 已完成
- `[FAILED]` 失敗

---

## MVP 功能

### P1: 專案架構設定 `[COMPLETED]`
- 安裝 Electron 相關依賴（electron, electron-builder）
- 建立 `main/main.ts` 主程序入口
- 設定 Electron + Vite 整合
- 設定測試框架（vitest）
- 調整 package.json scripts

### P2: 狀態列 Tray 功能 `[COMPLETED]`
- 建立 Tray 圖示（顯示於 Mac 狀態列）
- 實作右鍵選單（開始、停止、退出）
- 點擊 Tray 開啟計時器視窗（popover 樣式）
- Tray 圖示動態顯示剩餘時間

### P3: 計時器核心邏輯 `[COMPLETED]`
- 建立 `shared/types.ts` 型別定義
- 實作 `useTimer` hook（開始/暫停/停止/重置）
- 時間到達後繼續計時（超時模式）
- 主程序與渲染程序 IPC 通訊

### P4: 計時器 UI `[COMPLETED]`
- 時間設定介面（輸入或選擇預設時間）
- 計時器顯示畫面
- 開始/暫停/停止按鈕
- 超時狀態視覺提示（變色）

### P5: 通知提醒 `[COMPLETED]`
- Electron Notification API 系統通知
- 時間到達時觸發通知

### P6: 任務記錄 `[BACKLOG]`
- 停止後顯示任務輸入對話框
- 記錄任務資料（名稱、時間、時間戳記）
- 本地儲存（electron-store）
- 簡易歷史清單檢視

---

## Post-MVP

### F1: 多計時器支援 `[BACKLOG]`
### F2: 番茄鐘模式 `[BACKLOG]`
### F3: 統計報表 `[BACKLOG]`
### F4: 鍵盤快捷鍵 `[BACKLOG]`

---

## 完成記錄

### P1: 專案架構設定 (2025-01-15)
- ✅ 設定 Electron + Vite 整合 (electron-vite 2.3.0)
- ✅ 建立 main/main.ts 主程序入口
- ✅ 建立 main/preload.ts preload script
- ✅ 設定 vitest 測試框架（覆蓋率 100%）
- ✅ 設定 ESLint 程式碼檢查

### P2: 狀態列 Tray 功能 (2025-01-15)
- ✅ 實作 TrayManager 類別
- ✅ 實作右鍵選單（開始計時、暫停、停止、退出）
- ✅ 實作 popover 視窗
- ✅ 支援動態更新 Tray 標題
- ✅ 測試覆蓋率 ≥95%

### P3: 計時器核心邏輯 (2025-01-15)
- ✅ 建立 shared/types.ts 型別定義
- ✅ 實作 TimerService 類別（start/pause/resume/stop/reset）
- ✅ 實作 IPC 通訊處理器（timerHandlers）
- ✅ 更新 preload.ts 暴露計時器 API
- ✅ 實作 useTimer hook
- ✅ 測試覆蓋率 ≥95%（main: 99.56%, renderer: 100%）

### P4: 計時器 UI (2026-01-15)
- ✅ 建立 Timer 主元件
- ✅ 建立 TimerDisplay 時間顯示元件
- ✅ 建立 TimerControls 控制按鈕元件
- ✅ 建立 TimeInput 時間輸入元件
- ✅ 建立 PresetButtons 預設時間元件
- ✅ 超時狀態視覺提示（紅色樣式）
- ✅ 測試覆蓋率：main ≥95%, renderer 100%

### P5: 通知提醒 (2026-01-15)
- ✅ 實作 NotificationService 類別
- ✅ showTimerComplete() 顯示系統通知
- ✅ onClick 回呼支援
- ✅ isSupported() 靜態方法
- ✅ 與 TimerService onComplete 整合
- ✅ 測試覆蓋率 ≥95%

## 失敗記錄

_（尚無）_
