# PRP: P2 - 狀態列 Tray 功能

## 概述
實作 Mac 狀態列 Tray 功能，包含圖示、右鍵選單，以及點擊開啟計時器 popover 視窗。

## 驗收標準 (Acceptance Criteria)

### AC1: Tray 圖示
- [ ] 建立 Tray 圖示（支援 macOS 狀態列）
- [ ] 圖示大小符合 macOS 規範（16x16 或 22x22）
- [ ] 支援 Retina 顯示（@2x 圖示）

### AC2: 右鍵選單
- [ ] 實作 ContextMenu 右鍵選單
- [ ] 選單項目：開始計時、暫停、停止、分隔線、退出
- [ ] 選單項目根據計時器狀態動態更新

### AC3: Popover 視窗
- [ ] 點擊 Tray 圖示開啟視窗
- [ ] 視窗定位於 Tray 圖示下方
- [ ] 點擊視窗外部時自動關閉
- [ ] 視窗大小：400x300

### AC4: 動態圖示（後續與 P3 整合）
- [ ] 預留更新圖示文字的介面
- [ ] 支援顯示剩餘時間（如 "25:00"）

## 測試案例清單

### Unit Tests
1. `TrayManager` - 應能建立 Tray 實例
2. `TrayManager.createContextMenu` - 應建立正確的選單項目
3. `TrayManager.updateTitle` - 應能更新 Tray 標題
4. `TrayManager.showWindow` - 應能顯示視窗
5. `TrayManager.hideWindow` - 應能隱藏視窗

### Integration Tests
1. Tray 圖示應顯示於狀態列
2. 右鍵點擊應開啟選單
3. 選單項目應觸發對應動作

## 檔案結構

```
main/
├── main.ts
├── preload.ts
└── tray/
    ├── TrayManager.ts      # Tray 管理類別
    ├── tray.test.ts        # 測試檔案
    └── icons/              # 圖示資源
        ├── tray-icon.png
        └── tray-icon@2x.png
```

## 技術決策

- **Electron Tray API**: 使用原生 Electron Tray 功能
- **nativeImage**: 使用 nativeImage 處理圖示
- **BrowserWindow positioning**: 使用 Tray.getBounds() 計算視窗位置

## 相依性

- 相依 P1（專案架構設定）
- P3（計時器核心邏輯）完成後整合動態圖示

## 預估時間
1-2 個迭代週期

---
建立日期: 2025-01-15
狀態: IN_PROGRESS
