# 視窗存取功能設計

## 問題描述

當 macOS 狀態列被其他應用程式佔滿時，計時器的 Tray 圖示會被系統隱藏，導致用戶無法看到或操作計時器。

## 解決方案

實作兩個互補功能：

1. **Dock 圖示支援** - 提供額外的入口點
2. **浮動視窗模式** - 提供持續監控體驗

---

## 功能一：Dock 圖示整合

### 概述

移除 `skipTaskbar: true` 設定，讓應用程式在 Dock 上永遠顯示圖示。使用 Electron 的 `app.dock` API 實作 badge 和選單功能。

### 架構

新增 `DockManager` 類別，與現有的 `TrayManager` 平行：

```
main/
├── dock/
│   └── DockManager.ts    # 新增：Dock 圖示管理
├── tray/
│   └── TrayManager.ts    # 修改：移除 skipTaskbar
└── main.ts               # 修改：整合 DockManager
```

### DockManager 職責

- **badge 更新**：監聽計時事件，計算並顯示剩餘分鐘數
- **右鍵選單**：提供開始/暫停/繼續/停止選項（與 Tray 選單同步）
- **點擊處理**：點擊 Dock 圖示時顯示計時器視窗

### Badge 邏輯

| 狀態 | Badge 顯示 |
|-----|-----------|
| 閒置 | 無 badge |
| 計時中 25:30 | `26` |
| 計時中 0:45 | `1` |
| 超時 +3:20 | `+3` |

---

## 功能二：浮動視窗模式

### 概述

在現有 Popover 視窗基礎上，新增「釘選」功能。釘選後視窗變為可拖動的浮動視窗，失焦不隱藏。

### 視窗模式狀態

```typescript
type WindowMode = 'popover' | 'floating'
```

| 模式 | 失焦行為 | 可拖動 | 位置 |
|-----|---------|-------|------|
| popover | 自動隱藏 | 否 | Tray 下方 |
| floating | 保持顯示 | 是 | 記憶位置 |

### UI 變更

在視窗右上角新增釘選按鈕：

- **未釘選**：空心圖釘圖示，hover 提示「釘選視窗」
- **已釘選**：填滿圖釘圖示，hover 提示「取消釘選」

點擊按鈕透過 IPC 通知 Main Process 切換模式。

### IPC 通道

```typescript
// shared/types.ts 新增
WINDOW_PIN: 'window:pin'              // Renderer → Main：切換釘選
WINDOW_MODE_CHANGE: 'window:modeChange'  // Main → Renderer：模式變更通知
```

---

## TrayManager 修改

### 視窗建立參數

```typescript
private createWindowOptions() {
  return {
    width: 400,
    height: 340,
    show: false,
    frame: false,
    resizable: false,
    // skipTaskbar: true,  ← 移除
    movable: true,         // ← 新增
    alwaysOnTop: true,
    // ...其他設定不變
  }
}
```

### 新增方法

```typescript
class TrayManager {
  private windowMode: 'popover' | 'floating' = 'popover'
  private floatingPosition: { x: number; y: number } | null = null

  public togglePinned(): void
  public getWindowMode(): WindowMode
  private saveFloatingPosition(): void
  private loadFloatingPosition(): { x: number; y: number } | null
}
```

### 失焦行為

```typescript
window.on('blur', () => {
  if (this.windowMode === 'popover') {
    this.hideWindow()
  }
})
```

---

## 資料持久化

### 儲存結構

使用現有的 `electron-store` 擴充：

```typescript
interface StoreSchema {
  tasks: TaskRecord[]           // 既有
  windowSettings: {             // 新增
    mode: 'popover' | 'floating'
    floatingPosition: { x: number; y: number } | null
  }
}
```

### 儲存時機

| 事件 | 動作 |
|-----|------|
| 切換釘選模式 | 儲存 `mode` |
| 拖動視窗結束 | 儲存 `floatingPosition` |
| 應用程式啟動 | 載入設定，恢復上次狀態 |

### 視窗拖動偵測

```typescript
window.on('moved', () => {
  if (this.windowMode === 'floating') {
    const [x, y] = this.window.getPosition()
    this.saveFloatingPosition({ x, y })
  }
})
```

### 預設值

- `mode`: `'popover'`
- `floatingPosition`: `null`（使用螢幕置中）

---

## 檔案變更總覽

### 新增檔案

| 檔案 | 說明 |
|-----|------|
| `main/dock/DockManager.ts` | Dock 圖示、badge、選單管理 |
| `renderer/src/components/ui/pin-button.tsx` | 釘選按鈕元件 |

### 修改檔案

| 檔案 | 變更內容 |
|-----|---------|
| `main/tray/TrayManager.ts` | 移除 skipTaskbar、新增 floating 模式邏輯 |
| `main/main.ts` | 整合 DockManager、處理 Dock 點擊 |
| `main/preload.ts` | 暴露 `window:pin` API |
| `shared/types.ts` | 新增 IPC 通道、WindowMode 型別 |
| `renderer/src/App.tsx` | 加入釘選按鈕、監聯模式變更 |

---

## 實作順序

1. **Dock 圖示** - 先讓應用在 Dock 顯示
2. **DockManager** - badge 和選單功能
3. **浮動模式** - TrayManager 修改 + 持久化
4. **釘選 UI** - Renderer 元件和 IPC

---

## 測試重點

- [ ] Dock 圖示永遠顯示
- [ ] Dock badge 隨計時更新（顯示剩餘分鐘）
- [ ] Dock badge 超時顯示 +N
- [ ] Dock 右鍵選單與 Tray 選單同步
- [ ] 點擊 Dock 圖示顯示視窗
- [ ] 釘選按鈕正確切換圖示狀態
- [ ] 釘選後失焦不隱藏視窗
- [ ] 取消釘選後恢復 Popover 行為
- [ ] 浮動位置正確記憶和恢復
- [ ] 應用重啟後恢復上次模式和位置
