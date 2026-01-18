# Liquid Glass UI 設計文件

**日期：** 2026-01-19
**目標：** 實現毛玻璃視覺效果並消除垂直捲軸

---

## 問題分析

### 現狀
- 視窗尺寸：400×300px
- 背景：純白色 `#ffffff`
- 內容超出高度，出現垂直捲軸

### 解決方案
- 視窗高度調整：300 → 340px
- 元素間距壓縮：gap-6 → gap-4、gap-4 → gap-3
- 背景改為 macOS 原生毛玻璃效果

---

## 設計規格

### 1. Electron 視窗設定

**檔案：** `main/tray/TrayManager.ts`

```typescript
// createWindowOptions() 方法變更
{
  width: 400,
  height: 340,              // 從 300 改為 340
  transparent: true,        // 從 false 改為 true
  vibrancy: 'popover',      // 新增：macOS 原生毛玻璃
  visualEffectState: 'active',  // 新增
  backgroundColor: '#00000000', // 從 #ffffff 改為透明
}
```

**平台相容性：** vibrancy 只在 macOS 生效，需加入平台判斷。

### 2. 佈局間距調整

**檔案：** `renderer/src/App.tsx`

| 位置 | 變更前 | 變更後 |
|------|--------|--------|
| 根容器 | `bg-white` | `bg-white/70` |
| 計時器區 padding | `p-4` | `p-3` |

**檔案：** `renderer/src/components/Timer/Timer.tsx`

| 位置 | 變更前 | 變更後 |
|------|--------|--------|
| 主容器 gap | `gap-6` | `gap-4` |
| idle 區塊 gap | `gap-4` | `gap-3` |

### 3. 色彩與透明度

**檔案：** `renderer/src/index.css`

```css
/* body 背景改為透明 */
body {
  @apply bg-transparent text-foreground;
}
```

**各元件色彩調整：**

| 元件 | 變更前 | 變更後 |
|------|--------|--------|
| 主背景 | `bg-white` | `bg-white/70` |
| 今日區塊 | `bg-gray-50/50` | `bg-white/40` |
| 分隔線 | `border-gray-200` | `border-white/30` |
| 任務 hover | `hover:bg-muted/50` | `hover:bg-white/50` |

### 4. 圓角處理

**App.tsx 根容器：**
```tsx
<div className="h-full bg-white/70 flex flex-col rounded-xl overflow-hidden">
```

### 5. 降級處理

**CSS 降級（index.css）：**
```css
@supports (backdrop-filter: blur(1px)) {
  .glass-container {
    @apply bg-white/70 backdrop-blur-xl;
  }
}

@supports not (backdrop-filter: blur(1px)) {
  .glass-container {
    @apply bg-white/95;
  }
}
```

**Electron 降級（TrayManager.ts）：**
```typescript
if (process.platform === 'darwin') {
  // macOS: 使用 vibrancy
} else {
  // 其他平台: 純色背景
}
```

---

## 檔案變更清單

1. `main/tray/TrayManager.ts` - 視窗設定
2. `renderer/src/index.css` - 全域樣式
3. `renderer/src/App.tsx` - 根佈局
4. `renderer/src/components/Timer/Timer.tsx` - 計時器間距
5. `renderer/src/components/Task/TodayTasks.tsx` - 任務列表樣式

---

## 測試要點

- [ ] 視窗無垂直捲軸
- [ ] 毛玻璃效果正確顯示
- [ ] 不同桌面背景下文字可讀性
- [ ] 點擊外部隱藏視窗功能正常
- [ ] 深色模式相容性（如適用）
