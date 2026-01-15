# React Timer Desktop

一款專為 macOS 設計的選單列計時器應用程式，使用 Electron、React 和 TypeScript 打造。

## 功能特色

- **系統匣整合** - 在 macOS 選單列運行，點擊即可開啟計時器介面
- **雙向計時模式**
  - **倒數模式** - 從設定時間倒數至 0
  - **正數模式** - 從 0 開始計時至目標時間
- **超時提醒** - 計時結束後自動進入超時狀態，持續追蹤額外時間
- **原生通知** - 計時完成時透過 macOS 通知中心發送提醒
- **任務記錄** - 自動儲存計時歷史，方便回顧追蹤
- **預設時間** - 快速選擇常用計時時長
- **暗色模式** - 支援 macOS 系統深色主題

## 技術棧

| 類別     | 技術                     |
| -------- | ------------------------ |
| 桌面框架 | Electron 33              |
| UI 框架  | React 19                 |
| 型別系統 | TypeScript 5.8           |
| 樣式框架 | Tailwind CSS 4           |
| 建置工具 | Vite + electron-vite     |
| UI 元件  | shadcn/ui + Radix UI     |
| 測試框架 | Vitest + Testing Library |
| 資料儲存 | electron-store           |

## 專案結構

```
react-timer-desktop/
├── main/                   # Electron 主程序
│   ├── main.ts            # 應用程式生命週期
│   ├── preload.ts         # 安全的 IPC 橋接
│   ├── timer/             # 計時器服務
│   ├── tray/              # 系統匣管理
│   ├── ipc/               # IPC 處理器
│   ├── notification/      # 通知服務
│   └── store/             # 資料持久化
├── renderer/              # React 前端應用
│   └── src/
│       ├── components/    # UI 元件
│       │   ├── Timer/     # 計時器相關元件
│       │   ├── Task/      # 任務管理元件
│       │   └── ui/        # shadcn/ui 元件
│       └── hooks/         # 自訂 Hooks
├── shared/                # 共享型別定義
│   └── types.ts
└── dist/                  # 建置輸出
```

## 安裝

### 前置需求

- Node.js 18 以上
- pnpm 8 以上

### 步驟

```bash
# 複製專案
git clone https://github.com/yourusername/react-timer-desktop.git
cd react-timer-desktop

# 安裝依賴
pnpm install

# 安裝 renderer 依賴
cd renderer && pnpm install && cd ..
```

## 開發指令

### 根目錄（完整應用程式）

```bash
pnpm dev              # 啟動 Electron 開發模式（支援熱重載）
pnpm build            # 建置生產版本
pnpm test             # 執行主程序與共享模組測試
pnpm test:watch       # 監聽模式測試
pnpm test:coverage    # 產生測試覆蓋率報告
pnpm lint             # ESLint 程式碼檢查
```

### Renderer 目錄（React 前端）

```bash
cd renderer
pnpm dev              # 僅啟動 Vite 開發伺服器
pnpm test             # 執行 React 元件測試
pnpm test:watch       # 監聽模式測試

# 新增 shadcn/ui 元件
pnpm dlx shadcn@latest add <component-name>
```

## 架構說明

### Electron 程序模型

```
┌──────────────────────────────────────────────┐
│ Main Process（主程序）                        │
│  - 應用程式生命週期管理                        │
│  - 系統匣與彈出視窗控制                        │
│  - 計時器狀態機                               │
│  - 原生通知發送                               │
│  - 任務資料持久化                             │
├──────────────────────────────────────────────┤
│ Preload Script（預載腳本）                    │
│  - 安全暴露 IPC API 給渲染程序                │
├──────────────────────────────────────────────┤
│ Renderer Process（渲染程序）                  │
│  - React UI 元件                             │
│  - 透過 IPC 與主程序通訊                      │
└──────────────────────────────────────────────┘
```

### 計時器狀態機

```
         ┌─────────────────┐
         │                 │
         ▼                 │
      ┌──────┐         ┌───────────┐
      │ idle │────────▶│  running  │
      └──────┘         └───────────┘
         ▲                 │    │
         │                 │    │
         │                 ▼    ▼
      ┌──────┐         ┌───────────┐
      │paused│◀────────│ overtime  │
      └──────┘         └───────────┘
```

- **idle** - 閒置狀態，等待開始
- **running** - 計時中
- **paused** - 已暫停
- **overtime** - 超時狀態（倒數模式專用）

### IPC 通訊

**Renderer → Main（請求/回應）**
- `timer:start` - 開始計時
- `timer:pause` - 暫停計時
- `timer:resume` - 繼續計時
- `timer:stop` - 停止計時
- `timer:reset` - 重置計時器
- `task:save` - 儲存任務記錄
- `task:getAll` - 取得所有任務
- `task:delete` - 刪除任務

**Main → Renderer（事件推送）**
- `timer:tick` - 每秒更新計時資料
- `timer:stateChange` - 狀態變更通知
- `timer:complete` - 計時完成通知

## 測試

本專案使用 Vitest 作為測試框架，測試覆蓋率門檻為 95%。

```bash
# 執行所有測試
pnpm test

# 監聽模式
pnpm test:watch

# 產生覆蓋率報告
pnpm test:coverage
```

## 建置

```bash
# 建置生產版本
pnpm build
```

建置產物位於 `dist/` 目錄：
- `dist/main/` - 編譯後的主程序
- `dist/preload/` - 編譯後的預載腳本
- `dist/renderer/` - 打包後的 React 應用
