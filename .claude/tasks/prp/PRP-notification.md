# PRP: P5 通知提醒

## 功能概述

當計時器時間到達時，透過 Electron Notification API 發送系統通知提醒使用者。

## 驗收標準 (Acceptance Criteria)

### AC1: 系統通知
- [ ] 時間到達時顯示系統通知
- [ ] 通知標題：「計時器」
- [ ] 通知內容：顯示已設定的時間長度
- [ ] 通知點擊後視窗獲得焦點

### AC2: 通知整合
- [ ] 與 TimerService 的 onComplete 事件整合
- [ ] 通知只在時間到達時觸發一次

## 元件規劃

```
main/
├── notification/
│   ├── NotificationService.ts     # 通知服務
│   └── __tests__/
│       └── NotificationService.test.ts
```

## 測試案例清單

### NotificationService
- [ ] 建構時不應拋出錯誤
- [ ] show() 應呼叫 Notification 建構函式
- [ ] show() 應設定正確的標題和內容
- [ ] 通知點擊應觸發 onClick 回呼

### 整合測試
- [ ] TimerService complete 事件應觸發通知
- [ ] 通知只觸發一次

## 技術規格

- **Notification API**: Electron 的 Notification 類別
- **測試**: Vitest with Electron mock
- **覆蓋率**: ≥ 95%
