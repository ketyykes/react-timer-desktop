import { Notification } from 'electron'
import { formatTime } from '../../shared/types'

/**
 * 通知服務設定
 */
export interface NotificationServiceOptions {
  /** 通知點擊回呼 */
  onClick?: () => void
}

/**
 * 通知服務類別
 * 負責管理系統通知的顯示
 */
export class NotificationService {
  private onClick?: () => void

  constructor(options: NotificationServiceOptions = {}) {
    this.onClick = options.onClick
  }

  /**
   * 檢查系統是否支援通知
   */
  static isSupported(): boolean {
    return Notification.isSupported()
  }

  /**
   * 顯示計時器完成通知
   * @param duration 計時器設定的時間長度（毫秒）
   * @returns Notification 實例
   */
  showTimerComplete(duration: number): Notification {
    const formattedTime = formatTime(duration)

    const notification = new Notification({
      title: '計時器',
      body: `${formattedTime} 時間到！`,
    })

    notification.on('click', () => {
      this.onClick?.()
    })

    notification.show()

    return notification
  }
}
