import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, dialog, shell, safeStorage } from 'electron'
import path from 'path'
import fs from 'fs'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null
let isQuitting = false

const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL

// 持久化设置文件路径
const SETTINGS_PATH = path.join(app.getPath('userData'), 'settings.json')

// ── 加密敏感字段 ──
// 只要 safeStorage 可用，写入的 settings.json 中这些字段将被 DPAPI 加密
const SENSITIVE_FIELDS = ['apiKey', 'sessionToken'] as const

function encryptSensitiveFields(data: any): any {
  if (!safeStorage.isEncryptionAvailable()) return data
  try {
    const copy = JSON.parse(JSON.stringify(data))
    if (Array.isArray(copy.accounts)) {
      for (const acct of copy.accounts) {
        for (const field of SENSITIVE_FIELDS) {
          if (acct[field]) {
            acct[field] = safeStorage.encryptString(acct[field]).toString('base64')
          }
        }
      }
    }
    copy._encrypted = true
    return copy
  } catch {
    return data
  }
}

function decryptSensitiveFields(data: any): any {
  if (!safeStorage.isEncryptionAvailable()) return data
  try {
    if (Array.isArray(data.accounts)) {
      for (const acct of data.accounts) {
        for (const field of SENSITIVE_FIELDS) {
          if (acct[field] && typeof acct[field] === 'string') {
            try {
              const buf = Buffer.from(acct[field], 'base64')
              acct[field] = safeStorage.decryptString(buf)
            } catch {
              // 解密失败：可能是旧明文格式（首次升级时尚未标记 _encrypted），
              // 或 safeStorage 密钥变化 → 保持原值不变
            }
          }
        }
      }
    }
    delete data._encrypted
    return data
  } catch {
    return data
  }
}

function readSettingsFile(): any {
  try {
    if (fs.existsSync(SETTINGS_PATH)) {
      const raw = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf-8'))
      return raw._encrypted ? decryptSensitiveFields(raw) : raw
    }
  } catch {}
  return null
}

function writeSettingsFile(data: any): boolean {
  try {
    const out = encryptSensitiveFields(data)
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(out, null, 2), 'utf-8')
    return true
  } catch {
    return false
  }
}

function createTrayIcon(): Tray {
  // 创建 16x16 的简单图标 (用 nativeImage 生成)
  const icon = nativeImage.createFromDataURL(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsTAAALEwEAmpwYAAABbklEQVR4nO2WvUoDQRSFv5mETWGRRrCwsLCwsLGwsLGwsLGwsLCwsLGwsLGwsLCwsLCwsLCwsLCwEGwEIRJ8aX4sxB8kYhD/wCZL8AA7szN3Z3dndu6BMWPOgczOufeec+fOvQtgMBgMBoPBYPgfCIA6cAvUYr63gSzwAnTWAvAJ3IdEY1UAqAM7wUsoM4CLhYrBfAfYAPocMKkRcAfsoI4AArgGVoDJEohHgDpzfxDgwIRhcxW4ZGsBbglyXg/j7yEBNKaxqRPyJ5UW4B0YBh4EBX1YClkugDCLUMJ/Az4jBhaQekAPmBXcn/1gvazEP/JU6CNbo8AnoLEe06vgAriQ8j3gBvgAMgJHciTOV2EAOwAuA0cGQrgAbOIEyVWAFDqbMphOp1P1er2hQqHA8/Nzh+12W8kHcDgcJp1OKxUVFYV0u93VWq0W6/V6arPZlEajEd1ul85mc3Wz2dBqtVAoFEomk9JqtdRqtXQ4HEomk0oul0un06Hb7dJsNof3+3SFAoGB8h6o/Hq9LqvVKqvVKqvVerU72cCWAkuhbPn3KRfPke9fDQaDwWAwGAw/Jx4AXHEKUWyO+WcAAAAASUVORK5CYII='
  )
  const trayIcon = new Tray(icon.resize({ width: 16, height: 16 }))
  trayIcon.setToolTip('API Monitor')
  trayIcon.setContextMenu(createTrayMenu())
  trayIcon.on('click', () => {
    if (mainWindow) {
      mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show()
    }
  })
  return trayIcon
}

function createTrayMenu(): Menu {
  return Menu.buildFromTemplate([
    {
      label: '显示/隐藏窗口',
      click: () => {
        if (mainWindow) {
          mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show()
        }
      }
    },
    {
      label: '刷新数据',
      click: () => {
        mainWindow?.webContents.send('refresh-data')
      }
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        isQuitting = true
        app.quit()
      }
    }
  ])
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 420,
    height: 680,
    minWidth: 220,
    minHeight: 120,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: true,
    skipTaskbar: false,
    icon: path.join(__dirname, '../resources/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    }
  })

  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault()
      mainWindow?.hide()
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// IPC Handlers
ipcMain.handle('get-platform', () => process.platform)

ipcMain.handle('set-always-on-top', (_event, flag: boolean) => {
  mainWindow?.setAlwaysOnTop(flag)
  return mainWindow?.isAlwaysOnTop()
})

ipcMain.handle('get-always-on-top', () => {
  return mainWindow?.isAlwaysOnTop() ?? false
})

ipcMain.handle('minimize-window', () => {
  mainWindow?.minimize()
})

ipcMain.handle('close-window', () => {
  mainWindow?.hide()
})

ipcMain.handle('quit-app', () => {
  isQuitting = true
  app.quit()
})

// 获取自启动命令行参数
// 打包后 exe 自带路径信息，无需参数；dev 模式必须传入项目根目录的绝对路径。
// 不能使用 process.argv.slice(1)（dev 模式下为相对路径 ['']），
// 因为 Windows 从注册表启动进程时 CWD 固定为 C:\WINDOWS\system32，
// 相对路径会解析失败，导致 "Cannot find module 'C:\WINDOWS\system32'" 错误。
function getAutoLaunchArgs(): string[] {
  if (app.isPackaged) return []
  return [process.cwd()]
}
ipcMain.handle('set-auto-launch', (_event, enable: boolean) => {
  app.setLoginItemSettings({
    openAtLogin: enable,
    name: 'API Monitor',
    args: getAutoLaunchArgs(),
  })
  return app.getLoginItemSettings().openAtLogin
})

ipcMain.handle('get-auto-launch', () => {
  return app.getLoginItemSettings().openAtLogin
})

// ── 厂商注册表 ──
interface ProviderHandler {
  name: string
  balanceUrl: string
  balanceMethod?: 'GET' | 'POST'
  balanceBody?: any
  usageUrls: string[]
  parseBalance(data: any): any
  checkAvailable(data: any): boolean
  verifyMessage(data: any): string
}

const providers: Record<string, ProviderHandler> = {
  deepseek: {
    name: 'DeepSeek',
    balanceUrl: 'https://api.deepseek.com/user/balance',
    usageUrls: [
      'https://platform.deepseek.com/api/v0/usage/cost',
      'https://platform.deepseek.com/api/v0/usage/amount',
    ],
    parseBalance(data: any) {
      return data  // 原生格式即 BalanceResponse
    },
    checkAvailable(data: any) {
      return data?.is_available === true
    },
    verifyMessage(data: any) {
      return data?.is_available !== undefined
        ? `API Key 有效 · 账户${data.is_available ? '可用' : '不可用'}`
        : 'API Key 有效'
    },
  },
  stepfun: {
    name: 'StepFun',
    balanceUrl: 'https://api.stepfun.com/v1/accounts',
    usageUrls: [],
    parseBalance(data: any) {
      // 统一转为 BalanceResponse 格式
      return {
        is_available: data?.object === 'account',
        balance_infos: [{
          currency: 'CNY',
          total_balance: String(data?.balance ?? 0),
          granted_balance: String(data?.total_voucher_balance ?? 0),
          topped_up_balance: String(data?.total_cash_balance ?? 0),
        }],
      }
    },
    checkAvailable(data: any) {
      return data?.object === 'account'
    },
    verifyMessage(data: any) {
      const type = data?.type === 'prepaid' ? '预付费' : data?.type || '未知'
      return `API Key 有效 · ${type}账户 · 余额 ¥${Number(data?.balance ?? 0).toFixed(2)}`
    },
  },
  unisound: {
    name: '云知声',
    balanceUrl: 'https://maas-api.unisound.com/v1/models',
    usageUrls: [],
    parseBalance(_data: any) {
      // 云知声 MaaS 平台无余额查询 API，用 /v1/models 验证 Key 有效性
      // 返回固定的可用状态
      return {
        is_available: true,
        balance_infos: [{
          currency: 'CNY',
          total_balance: '0',
          granted_balance: '0',
          topped_up_balance: '0',
        }],
      }
    },
    checkAvailable(_data: any) {
      return true  // /v1/models 返回 200 即视为可用
    },
    verifyMessage(_data: any) {
      return 'API Key 有效 · Token Plan 订阅账户'
    },
  },
  minimax: {
    name: 'MiniMax',
    balanceUrl: 'https://api.minimaxi.com/v1/chat/completions',
    balanceMethod: 'POST',
    balanceBody: { model: 'MiniMax-M3', messages: [{ role: 'user', content: 'hi' }], max_tokens: 1 },
    usageUrls: [],
    parseBalance(_data: any) {
      return {
        is_available: true,
        balance_infos: [{
          currency: 'CNY',
          total_balance: '0',
          granted_balance: '0',
          topped_up_balance: '0',
        }],
      }
    },
    checkAvailable(_data: any) {
      return true
    },
    verifyMessage(_data: any) {
      return 'API Key 有效 · Coding Plan 订阅账户'
    },
  },
}

function getProvider(providerId: string): ProviderHandler | undefined {
  return providers[providerId]
}

ipcMain.handle('fetch-balance', async (_event, provider: string, apiKey: string) => {
  const p = getProvider(provider)
  if (!p) return { error: true, message: `未知厂商: ${provider}` }

  try {
    const isPost = p.balanceMethod === 'POST'
    const fetchOptions: any = {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    }
    if (isPost) {
      fetchOptions.method = 'POST'
      fetchOptions.body = JSON.stringify(p.balanceBody || {})
    }
    const response = await fetch(p.balanceUrl, fetchOptions)
    if (!response.ok) {
      const err = await response.text().catch(() => '')
      return { error: true, status: response.status, message: err || `HTTP ${response.status}` }
    }
    const raw = await response.json()
    return p.parseBalance(raw)
  } catch (e: any) {
    return { error: true, message: e.message || 'Network error' }
  }
})

ipcMain.handle('fetch-usage', async (_event, provider: string, apiKey: string) => {
  const p = getProvider(provider)
  if (!p || p.usageUrls.length === 0) return {}

  const results: Record<string, any> = {}
  for (const url of p.usageUrls) {
    try {
      const resp = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        }
      })
      if (resp.ok) {
        const data = await resp.json()
        results[url] = data
      }
    } catch {
      // skip failed endpoints
    }
  }
  return results
})

// 检查 API Key 是否有效 — 调用对应厂商的余额端点验证
ipcMain.handle('verify-api-key', async (_event, provider: string, apiKey: string) => {
  const p = getProvider(provider)
  if (!p) return { success: false, message: `未知厂商: ${provider}` }

  try {
    const isPost = p.balanceMethod === 'POST'
    const fetchOptions: any = {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    }
    if (isPost) {
      fetchOptions.method = 'POST'
      fetchOptions.body = JSON.stringify(p.balanceBody || {})
    }
    const resp = await fetch(p.balanceUrl, fetchOptions)

    if (resp.ok) {
      const data = await resp.json()
      return { success: true, message: p.verifyMessage(data) }
    }

    if (resp.status === 401) {
      return { success: false, message: 'API Key 无效，请检查是否正确' }
    }
    if (resp.status === 429) {
      return { success: false, message: '请求太频繁，请稍后重试' }
    }

    return { success: false, message: `验证失败 (HTTP ${resp.status})` }
  } catch (e: any) {
    return { success: false, message: e.message || '网络错误' }
  }
})

// 文件持久化 — 保存到 userData（自动）
ipcMain.handle('write-settings', async (_event, data: any) => {
  return writeSettingsFile(data)
})

ipcMain.handle('read-settings', async () => {
  return readSettingsFile()
})

// 导出到文件 — 弹出保存对话框（同样加密敏感字段）
ipcMain.handle('save-settings-to-file', async (_event, data: any) => {
  try {
    const result = await dialog.showSaveDialog(mainWindow!, {
      title: '导出设置',
      defaultPath: 'api-monitor-settings.json',
      filters: [{ name: 'JSON 文件', extensions: ['json'] }],
    })
    if (result.canceled || !result.filePath) return false
    const out = encryptSensitiveFields(data)
    fs.writeFileSync(result.filePath, JSON.stringify(out, null, 2), 'utf-8')
    return true
  } catch {
    return false
  }
})

// 调整窗口大小
ipcMain.handle('resize-window', (_event, width: number, height: number) => {
  if (mainWindow) {
    mainWindow.setSize(width, height)
    return true
  }
  return false
})

// 移动窗口位置
ipcMain.handle('move-window', (_event, x: number, y: number) => {
  if (mainWindow) {
    mainWindow.setPosition(x, y)
    return true
  }
  return false
})

// 在默认浏览器中打开外部链接
ipcMain.handle('open-external', (_event, url: string) => {
  return shell.openExternal(url)
})

app.whenReady().then(() => {
  // 读取持久化设置，应用自启动配置
  const saved = readSettingsFile()
  if (saved?.autoLaunch) {
    app.setLoginItemSettings({
      openAtLogin: true,
      name: 'API Monitor',
      args: getAutoLaunchArgs(),
    })
  }
  createWindow()
  tray = createTrayIcon()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  isQuitting = true
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
