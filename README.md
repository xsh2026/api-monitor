# API Monitor

多厂商 AI API 余额 & 用量监控桌面悬浮窗工具。

支持 **DeepSeek** · **StepFun** · **云知声 (Unisound)** · **MiniMax** 四家厂商的 API Key 余额查询与用量追踪。

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Electron 33 |
| UI | React 18 + TypeScript 5.7 |
| 样式 | Tailwind CSS 3 |
| 动画 | Framer Motion 11 |
| 图表 | Recharts 2 |
| 构建 | Vite 6 + electron-builder |

## 功能

- **多厂商余额监控** — 同时添加多个厂商账户，每个账户独立显示余额及可用状态
- **用量追踪** — DeepSeek 支持按日查询 token 消耗与费用（图表展示）
- **视图模式** — 正常 / 紧凑 / 极简三种视图，一键切换
- **悬浮置顶** — 窗口始终置顶于其他应用之上，可随时开关
- **深色 / 浅色主题** — 一键切换
- **拖拽排序** — 账户卡片支持拖拽重排，置顶收藏常用账户
- **自动刷新** — 可配置 10s–5min 间隔自动拉取最新数据
- **开机自启动** — 设置面板一键开关，下次开机自动运行
- **系统托盘** — 最小化到托盘，右键菜单快捷操作
- **数据持久化** — localStorage 本地缓存 + userData/settings.json 自动保存，API Key 使用系统 DPAPI 加密存储
- **导出 / 导入** — 支持设置导出到文件，方便迁移
- **API Key 验证** — 添加账户时一键验证 Key 有效性

## 安装与运行

### 开发模式

```bash
# 安装依赖
npm install

# 启动开发服务器（Vite + Electron 热重载）
npm run dev
```

### 构建安装包

```bash
# 构建 Windows 安装包（NSIS）
npm run build:win
```

输出目录：`release/`

## 项目结构

```
api-monitor/
├── electron/
│   ├── main.ts          # Electron 主进程 — 窗口管理、IPC、厂商注册表
│   └── preload.ts       # contextBridge API 暴露给渲染进程
├── src/
│   ├── App.tsx           # 根组件
│   ├── main.tsx          # React 入口
│   ├── index.css         # Tailwind + 全局样式
│   ├── types/
│   │   └── index.ts      # 类型定义、厂商元数据 PROVIDERS
│   ├── context/
│   │   └── SettingsContext.tsx  # 全局设置状态管理
│   ├── components/
│   │   ├── Header.tsx         # 标题栏 + 设置面板
│   │   ├── BalanceCard.tsx    # 余额卡片
│   │   ├── UsageCard.tsx      # 用量图表卡片
│   │   ├── StatusIndicator.tsx # 刷新状态指示
│   │   └── AnimatedNumber.tsx  # 数字滚动动画
│   └── hooks/
│       ├── useBalance.ts       # 余额数据拉取
│       ├── useUsage.ts         # 用量数据拉取
│       └── useAutoRefresh.ts   # 自动刷新定时器
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── postcss.config.js
```

## 架构

### 厂商注册表模式

主进程 `electron/main.ts` 中维护一个 `providers` 注册表，每个厂商定义：

- 余额查询 URL 和解析函数
- 用量查询 URL（如有）
- Key 有效性验证逻辑

添加新厂商只需修改两处：
1. `src/types/index.ts` — 添加 `ProviderId` 枚举值 + `PROVIDERS` 元数据
2. `electron/main.ts` — 在 `providers` 中注册查询端点与解析函数

### 安全通信

渲染进程通过 `contextBridge` 暴露的 `window.electronAPI` 与主进程通信，启用了 `contextIsolation`，禁用了 `nodeIntegration`。

### 设置持久化

- **localStorage** — 即时读写缓存
- **userData/settings.json** — 800ms 防抖自动写入，API Key 等敏感字段经系统 DPAPI (`safeStorage`) 加密
- 首次启动时优先从 `settings.json` 恢复，兼容旧格式数据迁移

### 开机自启动

通过 `app.setLoginItemSettings({ openAtLogin, name, args })` 写入 Windows 注册表 `HKCU\Software\Microsoft\Windows\CurrentVersion\Run`。**必须显式传入 `args: process.argv.slice(1)`**，否则 dev 模式下裸 `electron.exe` 无项目路径参数会导致启动失败。

## 版本历史

| 版本 | 更新 |
|------|------|
| v1.6 | 开机自启动（修复注册表 `args` 缺失问题）、API Key DPAPI 加密、视图切换自适应窗口尺寸 |
| v1.5 | MiniMax 厂商支持、拖拽排序卡片、置顶功能、极简视图优化 |
| v1.4 | 多厂商架构重构、厂商注册表模式、点击卡片跳转平台、紧凑视图 |
| v1.0 | 初版 — DeepSeek 余额 + 用量图表监控 |

## License

MIT
