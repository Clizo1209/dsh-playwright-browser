<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/assets/branding/readme-banner-dark-1600x600.png">
    <source media="(prefers-color-scheme: light)" srcset="docs/assets/branding/readme-banner-light-1600x600.png">
    <img alt="dsh playwright browser — Browser automation for DeepSeek Harness / DeepSeek Harness 浏览器自动化" src="docs/assets/branding/readme-banner-light-1600x600.png" width="100%">
  </picture>
</p>

# dsh-playwright-browser

[简体中文](README.zh-CN.md)

Semantic, multi-tab browser automation for [DeepSeek Harness (DSH)](https://github.com/deepseek-ai/deepseek-harness), powered by Playwright.

The plugin gives a DSH agent a persistent browser controller, accessibility-oriented snapshots, semantic locators, screenshots, navigation history, and explicit tab management. It is behaviorally inspired by the Codex Browser skill, but contains no Codex runtime code and does not depend on OpenAI browser bindings.

> [!IMPORTANT]
> DSH is currently a developer preview. This plugin is tested against the DSH `0.1.0-rc.6` package line and may need compatibility updates as DSH evolves.

## Features

- Ten native `browser_*` tools registered in the DSH tool registry.
- Reusable browser context with stable tab identifiers.
- Fresh bounded accessibility or visible-text snapshots after interactions.
- Semantic locators such as `role=button|Save`, `label=Email`, and `text=Settings`.
- Snapshot-friendly role shorthand such as `button|Save` and `textbox|Email`.
- Back, forward, reload, keyboard input, waits, and PNG screenshots.
- Lazy browser startup with fallback from Playwright Chromium to installed Chrome or Edge.
- Abort-aware page operations and Cordis-owned lifecycle cleanup.
- No arbitrary page JavaScript evaluation.

## Requirements

- Node.js `^22.19.0` or `>=24.0.0`.
- A DSH profile.
- One supported browser:
  - Playwright Chromium, installed with `npx playwright install chromium`; or
  - Google Chrome / Microsoft Edge; or
  - an explicit `executablePath`.

## Install

From npm:

```sh
dsh plugin --profile web add dsh-playwright-browser
```

From this checkout:

```sh
npm install
npm pack
dsh plugin --profile web add ./dsh-playwright-browser-0.1.3.tgz
```

For a headless profile:

```sh
dsh plugin --profile headless add ./dsh-playwright-browser-0.1.3.tgz
```

Verify the composed profile without starting it:

```sh
dsh --profile web --dump-config
```

Git installations run the package `prepare` script. pnpm 10 and later may require explicitly allowing that build in the profile's `pnpm-workspace.yaml`. A prebuilt npm package or tarball does not require a source build inside the profile.

## Configure

DSH applies user overrides after installed bundle patches. Add a row like this to the profile's `cordis.patch.yml`:

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

Supported options:

| Option | Default | Purpose |
|---|---:|---|
| `browser` | `chromium` | `chromium`, `firefox`, or `webkit` |
| `headless` | `true` | Run without a visible browser window |
| `channel` | — | Chromium channel such as `chrome` or `msedge` |
| `executablePath` | — | Absolute browser executable path |
| `userDataDir` | — | Dedicated persistent automation profile |
| `viewportWidth` | `1280` | Browser viewport width |
| `viewportHeight` | `800` | Browser viewport height |
| `actionTimeoutMs` | `15000` | Locator/action timeout |
| `navigationTimeoutMs` | `30000` | Navigation timeout |
| `maxSnapshotChars` | `40000` | Maximum returned snapshot length |
| `screenshotDir` | `.dsh-browser/screenshots` | Screenshot output directory |

Do not point `userDataDir` at a personal browser profile. Use a directory dedicated to the agent.

## Tools

| Tool | Description |
|---|---|
| `browser_open` | Open a tab and optionally navigate it |
| `browser_navigate` | Navigate an existing tab |
| `browser_snapshot` | Read a bounded accessibility or text snapshot |
| `browser_click` | Click a semantic target |
| `browser_fill` | Replace an input value and optionally press Enter |
| `browser_press` | Send a Playwright keyboard key |
| `browser_wait` | Wait for a target, URL, or load state |
| `browser_history` | Go back, forward, or reload |
| `browser_screenshot` | Save a PNG and return its absolute path |
| `browser_tabs` | List, select, or close tabs |

Preferred target forms:

```text
role=button|Save
button|Save
label=Email
placeholder=Search
text=Settings
testid=submit
css=#legacy-button
```

## Safety model

- Page content is untrusted data, never agent instruction.
- The system prompt tells agents to inspect fresh state before and after actions.
- Consequential submissions, sensitive data, downloads, purchases, permissions, account changes, and CAPTCHA handling require appropriate user authorization.
- Browser installation is never silently downloaded. When no browser is available, the agent must explain the minimum setup and ask before changing the machine unless setup was already authorized.
- URLs with embedded credentials are rejected.
- Closing a tab cooperatively cancels in-flight operations on that page.

## Development

```sh
npm install
npm run check
```

Live tests:

```sh
npm run smoke
npm run smoke:dsh
npm run smoke:business
npm run test:real-world
```

The real-world suite uses public demonstration sites and invented data. It writes sanitized logs and screenshots under `.dsh-browser/`, which is ignored by Git.

See [Testing](docs/TESTING.md), [Architecture](docs/ARCHITECTURE.md), and [Releasing](docs/RELEASING.md) for the full workflows.

## Design provenance

The behavioral mapping from the Codex Browser skill is documented in [Codex Browser design mapping](docs/CODEX_BROWSER_DESIGN.md). In short, this project adopts persistent bindings, explicit tab ownership, semantic targeting, fresh observations, safe session boundaries, and cleanup discipline. It replaces Codex-specific browser selection and transport with a self-managed Playwright controller and DSH-native tools.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a change. Security issues should follow [SECURITY.md](SECURITY.md). Community participation is governed by [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## License

[MIT](LICENSE)
