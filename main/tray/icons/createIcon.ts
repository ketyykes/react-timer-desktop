/**
 * 這個檔案用於生成簡單的 Tray 圖示
 * 在實際專案中，應該使用設計師提供的圖示
 */

import fs from 'node:fs'
import path from 'node:path'

// 16x16 透明 PNG (簡單的計時器圖示佔位符)
// 實際專案應使用專業設計的圖示
const TRAY_ICON_BASE64 = `
iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlz
AAAD6AAAA+gBtXtSawAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAADLSURB
VDiNpZMxDoMwDEV/gqysHdkYewCOwNJT9Aq9AWfo0qkH6EGYWFm6ZmBlSBWJQPnaOJFi5Sf+tmMH
4G8Y55wAgIi6AKj7Z0DSdC8Skq6SUlYBcKKqxvCBiJ6JaAMRvQCgp6pHY8zDewDAGQCSJGmJaEtE
G2PMI4qi0wfAOefW8JuqtsaYXZIkbRiG1/cDyPO8LMvyAgDbPM+L1trDJ4AkAABVtS6K4p6I7suy
PAFAHMfnt4AkSVoAOBpjtlEUnf4CANzGGPOdv/AJCB6PsKXCFvwAAAAASUVORK5CYII=
`.trim()

/**
 * 建立 Tray 圖示檔案
 */
export function createTrayIcon(): void {
  const iconDir = path.join(__dirname)
  const iconPath = path.join(iconDir, 'tray-icon.png')

  // 確保目錄存在
  if (!fs.existsSync(iconDir)) {
    fs.mkdirSync(iconDir, { recursive: true })
  }

  // 將 base64 轉換為 PNG 檔案
  const buffer = Buffer.from(TRAY_ICON_BASE64, 'base64')
  fs.writeFileSync(iconPath, buffer)

  console.log(`Tray icon created at: ${iconPath}`)
}

// 如果直接執行此檔案，建立圖示
if (require.main === module) {
  createTrayIcon()
}
