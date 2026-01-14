import { TimerState, TimerData, formatTime } from '../../shared/types'

/**
 * 計時器事件回呼型別
 */
export interface TimerEventCallbacks {
  onTick?: (data: TimerData) => void
  onStateChange?: (previousState: TimerState, currentState: TimerState) => void
  onComplete?: (duration: number, actualElapsed: number) => void
}

/**
 * 計時器服務類別
 * 負責管理計時器的核心邏輯，包含開始、暫停、繼續、停止和重置功能
 */
export class TimerService {
  private state: TimerState = 'idle'
  private duration: number = 0
  private elapsed: number = 0
  private startTime: number = 0
  private pausedElapsed: number = 0
  private intervalId: ReturnType<typeof setInterval> | null = null
  private callbacks: TimerEventCallbacks = {}
  private hasCompleted: boolean = false

  /**
   * 設定事件回呼
   */
  setCallbacks(callbacks: TimerEventCallbacks): void {
    this.callbacks = callbacks
  }

  /**
   * 取得當前計時器資料
   */
  getData(): TimerData {
    const remaining = this.duration - this.elapsed
    return {
      state: this.state,
      duration: this.duration,
      remaining,
      elapsed: this.elapsed,
      isOvertime: remaining < 0,
    }
  }

  /**
   * 取得格式化的剩餘時間
   */
  getFormattedTime(): string {
    return formatTime(this.duration - this.elapsed)
  }

  /**
   * 開始計時
   * @param duration 持續時間（毫秒）
   */
  start(duration: number): void {
    if (duration <= 0) {
      throw new Error('Duration must be a positive number')
    }

    const previousState = this.state
    this.duration = duration
    this.elapsed = 0
    this.pausedElapsed = 0
    this.hasCompleted = false
    this.startTime = Date.now()
    this.setState('running')

    this.emitStateChange(previousState, this.state)
    this.startInterval()
  }

  /**
   * 暫停計時
   */
  pause(): void {
    if (this.state !== 'running' && this.state !== 'overtime') {
      return
    }

    const previousState = this.state
    this.pausedElapsed = this.elapsed
    this.stopInterval()
    this.setState('paused')
    this.emitStateChange(previousState, this.state)
  }

  /**
   * 繼續計時
   */
  resume(): void {
    if (this.state !== 'paused') {
      return
    }

    const previousState = this.state
    this.startTime = Date.now()

    // 根據剩餘時間決定狀態
    const remaining = this.duration - this.pausedElapsed
    if (remaining <= 0) {
      this.setState('overtime')
    } else {
      this.setState('running')
    }

    this.emitStateChange(previousState, this.state)
    this.startInterval()
  }

  /**
   * 停止計時
   */
  stop(): void {
    if (this.state === 'idle') {
      return
    }

    const previousState = this.state
    this.stopInterval()
    this.setState('idle')
    this.emitStateChange(previousState, this.state)
  }

  /**
   * 重置計時器
   */
  reset(): void {
    const previousState = this.state
    this.stopInterval()
    this.elapsed = 0
    this.pausedElapsed = 0
    this.hasCompleted = false

    if (this.state !== 'idle') {
      this.setState('idle')
      this.emitStateChange(previousState, this.state)
    }
  }

  /**
   * 銷毀計時器
   */
  destroy(): void {
    this.stopInterval()
    this.callbacks = {}
  }

  /**
   * 設定狀態
   */
  private setState(newState: TimerState): void {
    this.state = newState
  }

  /**
   * 啟動計時間隔
   */
  private startInterval(): void {
    this.stopInterval()

    // 立即發送一次 tick
    this.tick()

    this.intervalId = setInterval(() => {
      this.tick()
    }, 1000)
  }

  /**
   * 停止計時間隔
   */
  private stopInterval(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  /**
   * 計時器 tick 處理
   */
  private tick(): void {
    const now = Date.now()
    this.elapsed = this.pausedElapsed + (now - this.startTime)

    const remaining = this.duration - this.elapsed

    // 檢查是否達到時間並切換到 overtime
    if (remaining <= 0 && this.state === 'running') {
      const previousState = this.state
      this.setState('overtime')
      this.emitStateChange(previousState, this.state)

      // 觸發完成事件（只觸發一次）
      if (!this.hasCompleted) {
        this.hasCompleted = true
        this.emitComplete()
      }
    }

    this.emitTick()
  }

  /**
   * 發送 tick 事件
   */
  private emitTick(): void {
    this.callbacks.onTick?.(this.getData())
  }

  /**
   * 發送狀態變更事件
   */
  private emitStateChange(previousState: TimerState, currentState: TimerState): void {
    this.callbacks.onStateChange?.(previousState, currentState)
  }

  /**
   * 發送完成事件
   */
  private emitComplete(): void {
    this.callbacks.onComplete?.(this.duration, this.elapsed)
  }
}
