import { createServer } from 'node:http'
import { access } from 'node:fs/promises'
import { BrowserController } from '../lib/browser-controller.js'

const chromeCandidates = process.platform === 'darwin'
  ? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge']
  : []

let executablePath = process.env.DSH_BROWSER_FORCE_AUTO_DETECT === '1' ? undefined : process.env.DSH_BROWSER_EXECUTABLE_PATH
if (!executablePath && process.env.DSH_BROWSER_FORCE_AUTO_DETECT !== '1') {
  for (const candidate of chromeCandidates) {
    try {
      await access(candidate)
      executablePath = candidate
      break
    } catch {}
  }
}

const server = createServer((request, response) => {
  response.setHeader('content-type', 'text/html; charset=utf-8')
  response.end(`<!doctype html><title>DSH Browser Smoke</title><label>Name <input aria-label="Name"></label><button onclick="document.querySelector('h1').textContent='Hello '+document.querySelector('input').value">Go</button><h1>Ready</h1>`)
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
const address = server.address()
if (!address || typeof address === 'string') throw new Error('smoke server did not bind')

const controller = new BrowserController({
  browser: 'chromium',
  headless: true,
  ...(executablePath ? { executablePath } : {}),
  viewportWidth: 1000,
  viewportHeight: 700,
  actionTimeoutMs: 10_000,
  navigationTimeoutMs: 15_000,
  maxSnapshotChars: 20_000,
  screenshotDir: '.dsh-browser/smoke',
})
const signal = new AbortController().signal
try {
  const opened = await controller.open(`http://127.0.0.1:${address.port}`, signal)
  if (!opened.content.includes('Name') || opened.title !== 'DSH Browser Smoke') throw new Error('open snapshot was incomplete')
  await controller.fill('label=Name', 'Codex', true, false, opened.tabId, signal)
  const clicked = await controller.click('role=button|Go', true, opened.tabId, signal)
  if (!clicked.content.includes('Hello Codex')) throw new Error('semantic fill/click did not update the page')
  const shot = await controller.screenshot(opened.tabId, false, 'smoke.png', signal)
  if (shot.bytes < 100) throw new Error('screenshot was unexpectedly small')
  process.stdout.write(JSON.stringify({ ok: true, tabId: opened.tabId, screenshot: shot.path }) + '\n')
} finally {
  await controller.close()
  await new Promise(resolve => server.close(resolve))
}
