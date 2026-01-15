import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock Electron Notification
const mockNotificationShow = vi.fn()
const mockNotificationOn = vi.fn()

class MockNotification {
  static isSupported = vi.fn(() => true)

  title: string
  body: string
  private clickHandler: (() => void) | null = null

  constructor(options: { title: string; body: string }) {
    this.title = options.title
    this.body = options.body
  }

  show() {
    mockNotificationShow()
  }

  on(event: string, handler: () => void) {
    mockNotificationOn(event, handler)
    if (event === 'click') {
      this.clickHandler = handler
    }
    return this
  }

  // 測試用：模擬點擊
  simulateClick() {
    this.clickHandler?.()
  }
}

vi.mock('electron', () => ({
  Notification: MockNotification,
}))

describe('NotificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('constructor', () => {
    it('應成功建立實例', async () => {
      const { NotificationService } = await import('../NotificationService')
      expect(() => new NotificationService()).not.toThrow()
    })
  })

  describe('showTimerComplete()', () => {
    it('應建立並顯示通知', async () => {
      const { NotificationService } = await import('../NotificationService')
      const service = new NotificationService()

      service.showTimerComplete(300000)

      expect(mockNotificationShow).toHaveBeenCalledTimes(1)
    })

    it('應設定正確的標題', async () => {
      const { NotificationService } = await import('../NotificationService')
      const service = new NotificationService()

      const notification = service.showTimerComplete(300000)

      expect(notification.title).toBe('計時器')
    })

    it('應設定正確的內容（顯示時間）', async () => {
      const { NotificationService } = await import('../NotificationService')
      const service = new NotificationService()

      const notification = service.showTimerComplete(300000)

      expect(notification.body).toBe('05:00 時間到！')
    })

    it('不同時間長度應顯示正確的格式', async () => {
      const { NotificationService } = await import('../NotificationService')
      const service = new NotificationService()

      const notification1 = service.showTimerComplete(60000)
      expect(notification1.body).toBe('01:00 時間到！')

      const notification2 = service.showTimerComplete(1500000)
      expect(notification2.body).toBe('25:00 時間到！')
    })
  })

  describe('onClick callback', () => {
    it('應註冊 click 事件處理器', async () => {
      const { NotificationService } = await import('../NotificationService')
      const service = new NotificationService()

      service.showTimerComplete(300000)

      expect(mockNotificationOn).toHaveBeenCalledWith('click', expect.any(Function))
    })

    it('點擊時應觸發 onClick 回呼', async () => {
      const { NotificationService } = await import('../NotificationService')
      const onClick = vi.fn()
      const service = new NotificationService({ onClick })

      const notification = service.showTimerComplete(300000)

      // 模擬點擊
      ;(notification as unknown as MockNotification).simulateClick()

      expect(onClick).toHaveBeenCalledTimes(1)
    })

    it('無 onClick 回呼時點擊不應拋出錯誤', async () => {
      const { NotificationService } = await import('../NotificationService')
      const service = new NotificationService()

      const notification = service.showTimerComplete(300000)

      expect(() => {
        ;(notification as unknown as MockNotification).simulateClick()
      }).not.toThrow()
    })
  })

  describe('isSupported()', () => {
    it('應回傳通知是否支援', async () => {
      const { NotificationService } = await import('../NotificationService')

      expect(NotificationService.isSupported()).toBe(true)
    })
  })
})
