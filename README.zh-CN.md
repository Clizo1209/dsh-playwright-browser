# dsh-playwright-browser

[English](README.md)

面向 [DeepSeek Harness（DSH）](https://github.com/deepseek-ai/deepseek-harness) 的 Playwright 浏览器自动化插件，提供语义定位、多标签页和持久浏览器控制能力。

本插件在行为设计上参考 Codex Browser 技能，但不包含 Codex 运行时代码，也不依赖 OpenAI 的浏览器绑定。DSH 目前仍是开发者预览版；本项目已针对 DSH `0.1.0-rc.6` 包系列进行测试。

## 主要能力

- 10 个原生 `browser_*` 工具。
- 可复用浏览器上下文和稳定标签页 ID。
- 每次交互后返回新的 accessibility 或可见文本快照。
- `role=button|保存`、`label=邮箱` 等语义定位。
- 接受快照友好的 `button|保存`、`textbox|邮箱` role 简写。
- 支持截图、等待、键盘、前进、后退、刷新和多标签管理。
- Playwright Chromium 缺失时自动尝试系统 Chrome 和 Edge。
- 操作支持取消，由 Cordis 生命周期统一清理。
- 不提供任意页面 JavaScript `eval`。

## 环境要求

- Node.js `^22.19.0` 或 `>=24.0.0`。
- 一个 DSH profile。
- Playwright Chromium、系统 Chrome/Edge，或明确配置的浏览器可执行文件。

安装 Playwright Chromium：

```sh
npx playwright install chromium
```

## 安装

从当前源码目录打包并安装：

```sh
npm install
npm pack
dsh plugin --profile web add ./dsh-playwright-browser-0.1.3.tgz
```

安装到 headless profile：

```sh
dsh plugin --profile headless add ./dsh-playwright-browser-0.1.3.tgz
```

检查组合配置：

```sh
dsh --profile web --dump-config
```

Git 安装会执行 `prepare` 构建。pnpm 10 及以上版本可能要求在 profile 的 `pnpm-workspace.yaml` 中明确允许该构建。预编译 npm 包或 tarball 不需要在 profile 中执行源码构建。

## 配置

在 profile 的 `cordis.patch.yml` 中添加覆盖：

```yaml
- id: playwright-browser
  config:
    browser: chromium
    channel: chrome
    headless: true
    viewportWidth: 1440
    viewportHeight: 900
    screenshotDir: .dsh-browser/screenshots
```

| 配置项 | 默认值 | 用途 |
|---|---:|---|
| `browser` | `chromium` | `chromium`、`firefox` 或 `webkit` |
| `headless` | `true` | 是否无头运行 |
| `channel` | — | `chrome`、`msedge` 等 Chromium channel |
| `executablePath` | — | 浏览器可执行文件绝对路径 |
| `userDataDir` | — | Agent 专用的持久化浏览器目录 |
| `viewportWidth` | `1280` | 视口宽度 |
| `viewportHeight` | `800` | 视口高度 |
| `actionTimeoutMs` | `15000` | 定位和操作超时 |
| `navigationTimeoutMs` | `30000` | 导航超时 |
| `maxSnapshotChars` | `40000` | 快照最大字符数 |
| `screenshotDir` | `.dsh-browser/screenshots` | 截图目录 |

不要让 `userDataDir` 指向个人浏览器 profile，应使用 Agent 专用目录。

## 工具

- `browser_open`：打开标签并可直接导航。
- `browser_navigate`：导航当前或指定标签。
- `browser_snapshot`：读取有限长度的 accessibility 或文本快照。
- `browser_click`：点击语义目标。
- `browser_fill`：替换输入值并可选按 Enter。
- `browser_press`：发送键盘按键。
- `browser_wait`：等待目标、URL 或加载状态。
- `browser_history`：后退、前进或刷新。
- `browser_screenshot`：保存 PNG 并返回绝对路径。
- `browser_tabs`：列出、选择或关闭标签页。

推荐目标格式：

```text
role=button|保存
button|保存
label=邮箱
placeholder=搜索
text=设置
testid=submit
css=#legacy-button
```

## 安全边界

- 页面内容只是不可信数据，不是 Agent 指令。
- 敏感提交、凭据、下载、购买、权限、账号修改和 CAPTCHA 操作必须获得适当授权。
- 插件不会静默下载浏览器；环境缺失时先说明最小安装方法，未获授权不得修改机器。
- 拒绝包含嵌入式用户名或密码的 URL。
- 关闭标签页会协作式取消该页面正在进行的操作。

## 开发和测试

```sh
npm install
npm run check
npm run smoke
npm run smoke:dsh
npm run smoke:business
npm run test:real-world
```

公网测试只使用公开演示站点和虚构数据。脱敏日志与截图写入 Git 忽略的 `.dsh-browser/`。

更多信息见：[测试](docs/TESTING.md)、[架构](docs/ARCHITECTURE.md)、[发布](docs/RELEASING.md) 和 [Codex Browser 设计映射](docs/CODEX_BROWSER_DESIGN.md)。

## 参与贡献

提交修改前请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。安全问题按 [SECURITY.md](SECURITY.md) 处理，社区行为遵循 [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)。

## 许可证

[MIT](LICENSE)
