import { createServer } from 'node:http'
import { access } from 'node:fs/promises'
import { Context } from '@deepseek-ai/cordis'
import ToolRuntime from '@deepseek-ai/dsh-tools'
import SystemPrompt from '@deepseek-ai/dsh-system-prompt'
import * as BrowserPlugin from '../lib/index.js'

const candidates = process.platform === 'darwin'
  ? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge']
  : []
let executablePath = process.env.DSH_BROWSER_FORCE_AUTO_DETECT === '1' ? undefined : process.env.DSH_BROWSER_EXECUTABLE_PATH
if (!executablePath && process.env.DSH_BROWSER_FORCE_AUTO_DETECT !== '1') {
  for (const candidate of candidates) {
    try {
      await access(candidate)
      executablePath = candidate
      break
    } catch {}
  }
}

const server = createServer((_request, response) => {
  response.setHeader('content-type', 'text/html; charset=utf-8')
  response.end('<!doctype html><title>DSH Tool Smoke</title><label>Query <input aria-label="Query"></label><button onclick="document.querySelector(\'output\').textContent=document.querySelector(\'input\').value">Run</button><output>Idle</output>')
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
const address = server.address()
if (!address || typeof address === 'string') throw new Error('DSH smoke server did not bind')

const ctx = new Context()
const signal = new AbortController().signal
try {
  await ctx.plugin(SystemPrompt)
  await ctx.plugin(ToolRuntime)
  await ctx.plugin(BrowserPlugin, {
    browser: 'chromium',
    headless: true,
    ...(executablePath ? { executablePath } : {}),
    viewportWidth: 1000,
    viewportHeight: 700,
    actionTimeoutMs: 10_000,
    navigationTimeoutMs: 15_000,
    maxSnapshotChars: 20_000,
    screenshotDir: '.dsh-browser/dsh-smoke',
  })
  const toolNames = ctx.tools.schemas().map(tool => tool.name)
  for (const expected of ['browser_open', 'browser_snapshot', 'browser_click', 'browser_fill', 'browser_history', 'browser_tabs']) {
    if (!toolNames.includes(expected)) throw new Error(`DSH registry is missing ${expected}`)
  }
  const execute = (callId, name, args) => ctx.tools.execute({ callId, name, arguments: args, signal })
  const opened = await execute('dsh-browser-1', 'browser_open', { url: `http://127.0.0.1:${address.port}` })
  if (opened.isError || !opened.value.content.includes('Query')) throw new Error('browser_open failed through the DSH registry')
  const tabId = opened.value.tabId
  const filled = await execute('dsh-browser-2', 'browser_fill', { target: 'label=Query', value: 'registry works', exact: true, tab_id: tabId })
  if (filled.isError) throw new Error('browser_fill failed through the DSH registry')
  const clicked = await execute('dsh-browser-3', 'browser_click', { target: 'role=button|Run', exact: true, tab_id: tabId })
  if (clicked.isError || !clicked.value.content.includes('registry works')) throw new Error('browser_click failed through the DSH registry')
  process.stdout.write(JSON.stringify({ ok: true, tools: toolNames.filter(name => name.startsWith('browser_')).length, tabId }) + '\n')
} finally {
  await ctx.root.fiber.dispose()
  await new Promise(resolve => server.close(resolve))
}
