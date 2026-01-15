import { describe, it, expect } from 'vitest'
import { formatTime, parseTime, IPC_CHANNELS } from '../types'

describe('shared/types.ts', () => {
  describe('formatTime', () => {
    it('應正確格式化 0 毫秒', () => {
      expect(formatTime(0)).toBe('00:00')
    })

    it('應正確格式化正數時間', () => {
      expect(formatTime(1000)).toBe('00:01')
      expect(formatTime(60000)).toBe('01:00')
      expect(formatTime(61000)).toBe('01:01')
      expect(formatTime(3600000)).toBe('60:00')
    })

    it('應正確格式化負數時間（overtime）', () => {
      expect(formatTime(-1000)).toBe('-00:01')
      expect(formatTime(-61000)).toBe('-01:01')
    })

    it('應正確處理邊界情況（使用 ceil 確保不低估剩餘時間）', () => {
      expect(formatTime(500)).toBe('00:01') // 0.5 秒 → ceil → 1 秒
      expect(formatTime(1500)).toBe('00:02') // 1.5 秒 → ceil → 2 秒
      expect(formatTime(59999)).toBe('01:00') // 59.999 秒 → ceil → 60 秒
      expect(formatTime(298993)).toBe('04:59') // 298.993 秒 → ceil → 299 秒
    })

    it('應正確處理 undefined 和 NaN（防禦性處理）', () => {
      expect(formatTime(undefined as unknown as number)).toBe('00:00')
      expect(formatTime(null as unknown as number)).toBe('00:00')
      expect(formatTime(NaN)).toBe('00:00')
    })
  })

  describe('parseTime', () => {
    it('應正確解析純數字（秒）', () => {
      expect(parseTime('60')).toBe(60000)
      expect(parseTime('90')).toBe(90000)
      expect(parseTime('0')).toBe(0)
    })

    it('應正確解析 MM:SS 格式', () => {
      expect(parseTime('1:00')).toBe(60000)
      expect(parseTime('01:30')).toBe(90000)
      expect(parseTime('25:00')).toBe(1500000)
      expect(parseTime('0:30')).toBe(30000)
    })

    it('應忽略前後空白', () => {
      expect(parseTime('  60  ')).toBe(60000)
      expect(parseTime(' 1:00 ')).toBe(60000)
    })

    it('應拋出無效格式錯誤', () => {
      expect(() => parseTime('abc')).toThrow('Invalid time format')
      expect(() => parseTime('1:2')).toThrow('Invalid time format') // 秒數必須兩位
      expect(() => parseTime('1:2:3')).toThrow('Invalid time format')
    })
  })

  describe('IPC_CHANNELS', () => {
    it('應定義所有必要的 channel', () => {
      expect(IPC_CHANNELS.TIMER_START).toBe('timer:start')
      expect(IPC_CHANNELS.TIMER_PAUSE).toBe('timer:pause')
      expect(IPC_CHANNELS.TIMER_RESUME).toBe('timer:resume')
      expect(IPC_CHANNELS.TIMER_STOP).toBe('timer:stop')
      expect(IPC_CHANNELS.TIMER_RESET).toBe('timer:reset')
      expect(IPC_CHANNELS.TIMER_TICK).toBe('timer:tick')
      expect(IPC_CHANNELS.TIMER_STATE_CHANGE).toBe('timer:stateChange')
      expect(IPC_CHANNELS.TIMER_COMPLETE).toBe('timer:complete')
    })
  })
})
