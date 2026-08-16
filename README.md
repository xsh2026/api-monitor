# API Monitor

多厂商 AI API 余额与运行消耗监控桌面悬浮窗工具。

支持 **DeepSeek** · **StepFun** · **云知声 (Unisound)** · **MiniMax** 四家厂商的 API Key 余额查询与运行消耗监控。

## 下载安装

[**→ 下载最新版（v1.9.0）**](https://github.com/xsh2026/api-monitor/releases/latest)

下载 `API Monitor Setup x.x.x.exe`，双击安装即可。安装完成后桌面会生成快捷方式，启动后系统托盘出现图标。

> 安装包不包含任何 API Key，每个用户需要自行添加。

## 功能

- **多厂商余额监控** — 同时添加多个厂商账户，每个账户独立显示余额及可用状态
- **运行消耗统计** — 记录程序运行期间每个账户的余额消耗（本次运行 + 历史累计），本地持久化
- **分栏设置界面** — 点击设置齿轮，左侧设置面板右侧余额卡片同时可见
- **视图模式** — 正常 / 紧凑 / 极简三种视图，一键切换
- **悬浮置顶** — 窗口始终置顶于其他应用之上，可随时开关
- **界面风格** — 6 种风格一键切换（默认 / 野兽派 / 极简 / 奢华 / 纸印 / 霓虹），每种支持深色与浅色变体
- **深色 / 浅色主题** — 一键切换，所有风格下都生效
- **拖拽排序** — 账户卡片支持拖拽重排，置顶收藏常用账户
- **自动刷新** — 可配置 10s–5min 间隔自动拉取最新数据
- **开机自启动** — 设置面板一键开关，下次开机自动运行
- **系统托盘** — 最小化到托盘，右键菜单快捷操作
- **数据安全** — API Key 使用 Windows DPAPI 加密存储到本地，不上传任何数据
- **导出 / 导入** — 支持设置导出到文件，方便迁移
- **API Key 验证** — 添加账户时一键验证 Key 有效性

## 支持的厂商

| 厂商 | 余额查询 | 说明 |
|------|:---:|------|
| DeepSeek | ✓ | 余额 + 运行消耗统计 |
| StepFun | ✓ | 余额 + 账户类型 |
| 云知声 | - | API Key 有效性验证 |
| MiniMax | - | API Key 有效性验证 |

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Electron 33 |
| UI | React 18 + TypeScript 5.7 |
| 样式 | Tailwind CSS 3 |
| 动画 | Framer Motion 11 |
| 图表 | Recharts 2 |
| 构建 | Vite 6 + electron-builder |

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器（Vite + Electron 热重载）
npm run dev

# 构建 Windows 安装包
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
│   ├── index.css         # Tailwind + CSS token 系统
│   ├── types/
│   │   └── index.ts      # 类型定义、厂商元数据 PROVIDERS
│   ├── context/
│   │   └── SettingsContext.tsx  # 全局设置状态管理
│   ├── components/
│   │   ├── Header.tsx         # 标题栏
│   │   ├── SettingsPanel.tsx   # 设置面板
│   │   ├── BalanceCard.tsx    # 余额卡片
│   │   ├── UsageCard.tsx      # 用量图表卡片
│   │   ├── StatusIndicator.tsx # 刷新状态指示
│   │   └── AnimatedNumber.tsx  # 数字滚动动画
│   └── hooks/
│       ├── useBalance.ts      # 余额数据拉取
│       ├── useUsage.ts        # 用量数据拉取
│       └── useAutoRefresh.ts  # 自动刷新定时器
├── package.json
├── vite.config.ts
└── tailwind.config.js
```

## 架构

### 厂商注册表模式

主进程 `electron/main.ts` 中维护一个 `providers` 注册表，每个厂商定义余额查询 URL、解析函数、用量查询端点、Key 有效性验证逻辑。

添加新厂商只需修改两处：
1. `src/types/index.ts` — 添加 `ProviderId` 枚举值 + `PROVIDERS` 元数据
2. `electron/main.ts` — 在 `providers` 中注册查询端点与解析函数

### 安全

- 渲染进程通过 `contextBridge` 暴露的 `window.electronAPI` 与主进程通信
- 启用 `contextIsolation`，禁用 `nodeIntegration`
- API Key 使用系统 `safeStorage` (DPAPI) 加密存储

### 设置持久化

- `localStorage` — 即时读写
- `userData/settings.json` — 800ms 防抖自动保存，敏感字段 DPAPI 加密
- 首次启动优先从 `settings.json` 恢复

## License

MIT
