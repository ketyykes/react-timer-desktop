# PRP: P6 任務記錄

## 功能概述

停止計時器後，讓使用者輸入任務名稱，記錄任務資料（名稱、計時時間、時間戳記），並提供簡易歷史清單檢視。

## 驗收標準 (Acceptance Criteria)

### AC1: 任務輸入對話框
- [ ] 停止計時器後顯示任務輸入對話框
- [ ] 可輸入任務名稱（選填）
- [ ] 顯示本次計時時間長度
- [ ] 確認按鈕儲存任務
- [ ] 取消按鈕跳過儲存

### AC2: 任務資料儲存
- [ ] 使用 electron-store 本地儲存
- [ ] 記錄：任務名稱、設定時間、實際時間、時間戳記
- [ ] 資料持久化（重啟應用後仍存在）

### AC3: 歷史清單檢視
- [ ] 顯示歷史任務清單
- [ ] 依時間倒序排列
- [ ] 顯示任務名稱、時間、日期

## 元件規劃

```
main/
├── store/
│   ├── TaskStore.ts              # 任務儲存服務
│   └── __tests__/
│       └── TaskStore.test.ts
renderer/
├── src/
│   ├── components/
│   │   └── Task/
│   │       ├── TaskDialog.tsx       # 任務輸入對話框
│   │       ├── TaskHistory.tsx      # 歷史清單元件
│   │       └── __tests__/
│   │           ├── TaskDialog.test.tsx
│   │           └── TaskHistory.test.tsx
```

## 型別定義

```typescript
// shared/types.ts 新增
export interface TaskRecord {
  id: string
  name: string
  duration: number      // 設定的時間（毫秒）
  actualTime: number    // 實際計時時間（毫秒）
  createdAt: number     // Unix timestamp
}
```

## IPC 通道

```typescript
// 新增 IPC 通道
'task:save'     // 儲存任務記錄
'task:getAll'   // 取得所有任務記錄
'task:delete'   // 刪除任務記錄（可選）
```

## 測試案例清單

### TaskStore (main)
- [ ] 建構時不應拋出錯誤
- [ ] save() 應儲存任務記錄
- [ ] getAll() 應回傳所有任務記錄
- [ ] getAll() 應依時間倒序排列
- [ ] delete() 應刪除指定任務

### TaskDialog (renderer)
- [ ] 應顯示對話框標題
- [ ] 應顯示計時時間
- [ ] 應有任務名稱輸入框
- [ ] 點擊確認應觸發 onConfirm
- [ ] 點擊取消應觸發 onCancel
- [ ] 空名稱應使用預設名稱

### TaskHistory (renderer)
- [ ] 無任務時顯示空狀態
- [ ] 應顯示任務清單
- [ ] 應顯示任務名稱和時間
- [ ] 應依時間倒序排列

## 技術規格

- **儲存**: electron-store
- **ID 生成**: crypto.randomUUID()
- **測試**: Vitest with mocks
- **覆蓋率**: ≥ 95%
