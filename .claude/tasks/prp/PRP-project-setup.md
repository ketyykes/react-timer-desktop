# PRP: P1 - 專案架構設定

## 概述
將現有的 React + Vite 專案轉換為 Electron 桌面應用，設定開發環境和測試框架。

## 驗收標準 (Acceptance Criteria)

### AC1: Electron 依賴安裝
- [ ] 安裝 `electron` 作為 devDependency
- [ ] 安裝 `electron-builder` 用於打包
- [ ] 安裝 `electron-vite` 用於 Vite 整合

### AC2: 主程序入口
- [ ] 建立 `main/main.ts` 檔案
- [ ] 實作 BrowserWindow 建立邏輯
- [ ] 設定 preload script 路徑
- [ ] 設定 window 在 ready 事件時啟動

### AC3: Electron + Vite 整合
- [ ] 建立 `electron.vite.config.ts` 設定檔
- [ ] 設定 main/preload/renderer 三個部分
- [ ] 確保 HMR 在開發模式可用

### AC4: 測試框架
- [ ] 安裝 `vitest` 和相關依賴
- [ ] 建立 `vitest.config.ts` 設定檔
- [ ] 設定覆蓋率報告（istanbul）
- [ ] 新增範例測試確認設定正確

### AC5: Package.json Scripts
- [ ] `pnpm dev` - 啟動 Electron 開發模式
- [ ] `pnpm build` - 建置專案
- [ ] `pnpm test` - 執行測試
- [ ] `pnpm test:coverage` - 執行測試並產生覆蓋率報告
- [ ] `pnpm lint` - 執行 ESLint

## 測試案例清單

### Unit Tests
1. `main/main.ts` - 應匯出 createWindow 函式
2. `preload/preload.ts` - 應正確暴露 IPC API

### Integration Tests
1. Electron app 應能成功啟動
2. 渲染程序應能載入 React 應用

## 目錄結構變更

```
react-timer-desktop/
├── main/
│   ├── main.ts           # Electron 主程序
│   └── preload.ts        # Preload script
├── renderer/             # React 渲染程序（現有）
│   ├── src/
│   └── ...
├── shared/               # 共用型別（後續 P3 新增）
├── electron.vite.config.ts
├── package.json          # 根目錄設定
└── vitest.config.ts
```

## 技術決策

- **electron-vite**: 使用 electron-vite 整合，而非手動設定，簡化開發流程
- **vitest**: 選擇 vitest 因為與 Vite 生態系統整合良好，執行速度快
- **TypeScript**: 全專案使用 TypeScript 確保型別安全

## 預估時間
1 個迭代週期

---
建立日期: 2025-01-15
狀態: IN_PROGRESS
