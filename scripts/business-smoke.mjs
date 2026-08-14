import { access } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { Context } from '@deepseek-ai/cordis'
import ToolRuntime from '@deepseek-ai/dsh-tools'
import SystemPrompt from '@deepseek-ai/dsh-system-prompt'

const pluginPath = resolve(process.env.DSH_BROWSER_PLUGIN_PATH ?? 'lib/index.js')
const BrowserPlugin = await import(pathToFileURL(pluginPath).href)
const candidates = process.platform === 'darwin'
  ? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge']
  : []
let executablePath = process.env.DSH_BROWSER_EXECUTABLE_PATH
if (!executablePath) {
  for (const candidate of candidates) {
    try {
      await access(candidate)
      executablePath = candidate
      break
    } catch {}
  }
}

const ctx = new Context()
const signal = new AbortController().signal
try {
  await ctx.plugin(SystemPrompt)
  await ctx.plugin(ToolRuntime)
  await ctx.plugin(BrowserPlugin, {
    browser: 'chromium',
    headless: true,
    ...(executablePath ? { executablePath } : {}),
    viewportWidth: 1280,
    viewportHeight: 800,
    actionTimeoutMs: 20_000,
    navigationTimeoutMs: 45_000,
    maxSnapshotChars: 30_000,
    screenshotDir: '.dsh-browser/business-smoke',
  })
  const execute = (callId, name, args) => ctx.tools.execute({ callId, name, arguments: args, signal })
  const opened = await execute('business-1', 'browser_open', { url: 'https://www.wikipedia.org/' })
  if (opened.isError) throw new Error(`open failed: ${opened.content.map(block => block.type === 'text' ? block.text : '').join(' ')}`)
  const tabId = opened.value.tabId
  const searched = await execute('business-2', 'browser_fill', {
    target: 'css=#searchInput',
    value: 'Playwright',
    submit: true,
    tab_id: tabId,
  })
  if (searched.isError) throw new Error('Wikipedia search interaction failed')
  const settled = await execute('business-3', 'browser_wait', {
    state: 'domcontentloaded',
    tab_id: tabId,
  })
  if (settled.isError || !settled.value.content.toLowerCase().includes('playwright')) {
    throw new Error('Wikipedia result did not contain the searched topic')
  }
  const screenshot = await execute('business-4', 'browser_screenshot', {
    file_name: 'wikipedia-playwright.png',
    tab_id: tabId,
  })
  if (screenshot.isError || screenshot.value.bytes < 100) throw new Error('business screenshot failed')
  const backed = await execute('business-5', 'browser_history', { action: 'back', tab_id: tabId })
  if (backed.isError || !backed.value.url.includes('wikipedia.org')) throw new Error('history navigation failed')
  process.stdout.write(JSON.stringify({
    ok: true,
    pluginPath,
    resultUrl: settled.value.url,
    resultTitle: settled.value.title,
    screenshot: screenshot.value.path,
    screenshotBytes: screenshot.value.bytes,
    returnedUrl: backed.value.url,
  }) + '\n')
} finally {
  await ctx.root.fiber.dispose()
}
