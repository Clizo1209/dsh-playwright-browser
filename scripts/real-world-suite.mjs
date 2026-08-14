import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { Context } from '@deepseek-ai/cordis'
import ToolRuntime from '@deepseek-ai/dsh-tools'
import SystemPrompt from '@deepseek-ai/dsh-system-prompt'

const pluginPath = resolve(process.env.DSH_BROWSER_PLUGIN_PATH ?? 'lib/index.js')
const BrowserPlugin = await import(pathToFileURL(pluginPath).href)
const evidenceDir = resolve('.dsh-browser/real-world-suite')
const eventLogPath = resolve(evidenceDir, 'tool-events.jsonl')
const reportPath = resolve(evidenceDir, 'report.json')
const markdownReportPath = resolve(evidenceDir, 'report.md')
await mkdir(evidenceDir, { recursive: true })

const ctx = new Context()
const signal = new AbortController().signal
const events = []
const cases = []
const sensitiveValues = new Set()
let sequence = 0

function sanitizeArgs(name, args) {
  if (name === 'browser_fill' && /password/i.test(String(args.target))) {
    if (typeof args.value === 'string' && args.value.length > 0) sensitiveValues.add(args.value)
    return { ...args, value: '[REDACTED]' }
  }
  return args
}

function sanitizeText(raw) {
  let text = raw
  for (const value of sensitiveValues) text = text.replaceAll(value, '[REDACTED]')
  return text
}

function sanitizeUrl(raw) {
  try {
    const url = new URL(raw)
    for (const key of url.searchParams.keys()) {
      if (/pass(?:word)?|token|secret|api[-_]?key/i.test(key)) url.searchParams.set(key, '[REDACTED]')
    }
    return url.toString()
  } catch {
    return raw
  }
}

function resultSummary(result) {
  if (result.isError) {
    return {
      isError: true,
      error: result.content?.map(block => block.type === 'text' ? block.text : '').join(' ').slice(0, 800),
    }
  }
  const value = result.value ?? {}
  return {
    isError: false,
    ...(typeof value.tabId === 'string' ? { tabId: value.tabId } : {}),
    ...(typeof value.title === 'string' ? { title: value.title } : {}),
    ...(typeof value.url === 'string' ? { url: sanitizeUrl(value.url) } : {}),
    ...(typeof value.content === 'string' ? { contentExcerpt: sanitizeText(value.content).replace(/\s+/g, ' ').slice(0, 500) } : {}),
    ...(typeof value.path === 'string' ? { path: value.path } : {}),
    ...(typeof value.bytes === 'number' ? { bytes: value.bytes } : {}),
    ...(Array.isArray(value) ? { tabs: value } : {}),
  }
}

async function execute(caseId, name, args) {
  const startedAt = new Date().toISOString()
  const started = performance.now()
  const result = await ctx.tools.execute({
    callId: `real-${++sequence}`,
    name,
    arguments: args,
    signal,
  })
  const sanitizedArguments = sanitizeArgs(name, args)
  events.push({
    sequence,
    caseId,
    startedAt,
    durationMs: Math.round(performance.now() - started),
    tool: name,
    arguments: sanitizedArguments,
    result: resultSummary(result),
  })
  if (result.isError) throw new Error(`${caseId}: ${name} failed: ${events.at(-1).result.error}`)
  return result.value
}

function assertIncludes(caseId, actual, expected) {
  if (!actual.toLowerCase().includes(expected.toLowerCase())) {
    throw new Error(`${caseId}: expected content to include ${JSON.stringify(expected)}`)
  }
}

async function runCase(id, description, operation) {
  const startedAt = new Date().toISOString()
  const started = performance.now()
  try {
    const evidence = await operation()
    cases.push({ id, description, status: 'passed', startedAt, durationMs: Math.round(performance.now() - started), evidence })
  } catch (error) {
    cases.push({ id, description, status: 'failed', startedAt, durationMs: Math.round(performance.now() - started), error: error instanceof Error ? error.message : String(error) })
  }
}

try {
  await ctx.plugin(SystemPrompt)
  await ctx.plugin(ToolRuntime)
  await ctx.plugin(BrowserPlugin, {
    browser: 'chromium',
    headless: true,
    viewportWidth: 1280,
    viewportHeight: 900,
    actionTimeoutMs: 20_000,
    navigationTimeoutMs: 45_000,
    maxSnapshotChars: 40_000,
    screenshotDir: evidenceDir,
  })

  await runCase('wikipedia-information', 'Extract visible information from a live Wikipedia article.', async () => {
    const opened = await execute('wikipedia-information', 'browser_open', { url: 'https://en.wikipedia.org/wiki/Playwright_(software)' })
    const snapshot = await execute('wikipedia-information', 'browser_snapshot', { tab_id: opened.tabId, mode: 'text' })
    assertIncludes('wikipedia-information', snapshot.title, 'Playwright')
    assertIncludes('wikipedia-information', snapshot.content, 'browser')
    assertIncludes('wikipedia-information', snapshot.content, 'Microsoft')
    const screenshot = await execute('wikipedia-information', 'browser_screenshot', { tab_id: opened.tabId, full_page: false, file_name: 'wikipedia-software.png' })
    await execute('wikipedia-information', 'browser_tabs', { action: 'close', tab_id: opened.tabId })
    return { title: snapshot.title, url: snapshot.url, factsVerified: ['browser', 'Microsoft'], screenshot: screenshot.path, screenshotBytes: screenshot.bytes }
  })

  await runCase('selenium-get-form', 'Fill and submit Selenium official public GET form with invented data.', async () => {
    const opened = await execute('selenium-get-form', 'browser_open', { url: 'https://www.selenium.dev/selenium/web/web-form.html' })
    const tabId = opened.tabId
    await execute('selenium-get-form', 'browser_fill', { target: 'label=Text input', value: 'DSH Browser QA', exact: true, tab_id: tabId })
    await execute('selenium-get-form', 'browser_fill', { target: 'label=Password', value: 'demo-only-value', exact: true, tab_id: tabId })
    await execute('selenium-get-form', 'browser_fill', { target: 'label=Textarea', value: 'Automated public form validation', exact: true, tab_id: tabId })
    await execute('selenium-get-form', 'browser_fill', { target: 'placeholder=Type to search...', value: 'New York', exact: true, tab_id: tabId })
    await execute('selenium-get-form', 'browser_click', { target: 'label=Default checkbox', exact: true, tab_id: tabId })
    await execute('selenium-get-form', 'browser_click', { target: 'label=Default radio', exact: true, tab_id: tabId })
    const before = await execute('selenium-get-form', 'browser_screenshot', { tab_id: tabId, full_page: true, file_name: 'selenium-form-filled.png' })
    const submitted = await execute('selenium-get-form', 'browser_click', { target: 'role=button|Submit', exact: true, tab_id: tabId })
    assertIncludes('selenium-get-form', submitted.title, 'target page')
    assertIncludes('selenium-get-form', submitted.content, 'Form submitted')
    assertIncludes('selenium-get-form', submitted.content, 'Received!')
    const submittedUrl = new URL(submitted.url)
    if (submittedUrl.searchParams.get('my-text') !== 'DSH Browser QA') throw new Error('selenium-get-form: text input was not submitted')
    if (submittedUrl.searchParams.get('my-textarea') !== 'Automated public form validation') throw new Error('selenium-get-form: textarea was not submitted')
    if (submittedUrl.searchParams.get('my-datalist') !== 'New York') throw new Error('selenium-get-form: datalist value was not submitted')
    if (submittedUrl.searchParams.getAll('my-check').length !== 2) throw new Error('selenium-get-form: checkbox state was not submitted')
    const after = await execute('selenium-get-form', 'browser_screenshot', { tab_id: tabId, full_page: false, file_name: 'selenium-form-submitted.png' })
    await execute('selenium-get-form', 'browser_tabs', { action: 'close', tab_id: tabId })
    return { title: submitted.title, url: sanitizeUrl(submitted.url), verifiedFields: ['my-text', 'my-textarea', 'my-datalist', 'my-check'], confirmation: 'Form submitted / Received!', beforeScreenshot: before.path, afterScreenshot: after.path }
  })

  await runCase('httpbin-post-form', 'Fill and submit httpbin public POST echo form with invented data.', async () => {
    const opened = await execute('httpbin-post-form', 'browser_open', { url: 'https://httpbin.org/forms/post' })
    const tabId = opened.tabId
    await execute('httpbin-post-form', 'browser_fill', { target: 'label=Customer name:', value: 'DSH Test Customer', tab_id: tabId })
    await execute('httpbin-post-form', 'browser_fill', { target: 'label=Telephone:', value: '555-0100', tab_id: tabId })
    await execute('httpbin-post-form', 'browser_fill', { target: 'label=E-mail address:', value: 'dsh-test@example.com', tab_id: tabId })
    await execute('httpbin-post-form', 'browser_click', { target: 'label=Medium', exact: true, tab_id: tabId })
    await execute('httpbin-post-form', 'browser_click', { target: 'label=Extra Cheese', exact: true, tab_id: tabId })
    await execute('httpbin-post-form', 'browser_click', { target: 'label=Mushroom', exact: true, tab_id: tabId })
    await execute('httpbin-post-form', 'browser_fill', { target: 'label=Preferred delivery time:', value: '18:30', tab_id: tabId })
    await execute('httpbin-post-form', 'browser_fill', { target: 'label=Delivery instructions:', value: 'Public demo submission only', tab_id: tabId })
    const before = await execute('httpbin-post-form', 'browser_screenshot', { tab_id: tabId, full_page: true, file_name: 'httpbin-form-filled.png' })
    const submitted = await execute('httpbin-post-form', 'browser_click', { target: 'role=button|Submit order', exact: true, tab_id: tabId })
    const response = await execute('httpbin-post-form', 'browser_snapshot', { tab_id: tabId, mode: 'text' })
    assertIncludes('httpbin-post-form', response.content, 'DSH Test Customer')
    assertIncludes('httpbin-post-form', response.content, 'dsh-test@example.com')
    assertIncludes('httpbin-post-form', response.content, 'Public demo submission only')
    const after = await execute('httpbin-post-form', 'browser_screenshot', { tab_id: tabId, full_page: true, file_name: 'httpbin-post-response.png' })
    await execute('httpbin-post-form', 'browser_tabs', { action: 'close', tab_id: tabId })
    return { url: submitted.url, echoedValues: ['DSH Test Customer', 'dsh-test@example.com', 'Public demo submission only'], beforeScreenshot: before.path, afterScreenshot: after.path }
  })

  await runCase('multi-tab-navigation', 'Manage and inspect multiple live public-site tabs.', async () => {
    const first = await execute('multi-tab-navigation', 'browser_open', { url: 'https://example.com/' })
    const second = await execute('multi-tab-navigation', 'browser_open', { url: 'https://www.iana.org/help/example-domains' })
    const listed = await execute('multi-tab-navigation', 'browser_tabs', { action: 'list' })
    if (listed.length !== 2) throw new Error(`multi-tab-navigation: expected 2 tabs, received ${listed.length}`)
    await execute('multi-tab-navigation', 'browser_tabs', { action: 'select', tab_id: first.tabId })
    const snapshot = await execute('multi-tab-navigation', 'browser_snapshot', { tab_id: first.tabId, mode: 'text' })
    assertIncludes('multi-tab-navigation', snapshot.content, 'Example Domain')
    await execute('multi-tab-navigation', 'browser_tabs', { action: 'close', tab_id: second.tabId })
    await execute('multi-tab-navigation', 'browser_tabs', { action: 'close', tab_id: first.tabId })
    const empty = await execute('multi-tab-navigation', 'browser_tabs', { action: 'list' })
    if (empty.length !== 0) throw new Error(`multi-tab-navigation: expected no tabs, received ${empty.length}`)
    return { openedUrls: [first.url, second.url], observedTabCount: listed.length, finalTabCount: empty.length }
  })
} finally {
  await ctx.root.fiber.dispose()
  await writeFile(eventLogPath, events.map(event => JSON.stringify(event)).join('\n') + '\n', 'utf8')
  const report = {
    ok: cases.length === 4 && cases.every(item => item.status === 'passed'),
    generatedAt: new Date().toISOString(),
    pluginPath,
    cases,
    toolCalls: events.length,
    eventLogPath,
  }
  await writeFile(reportPath, JSON.stringify(report, null, 2) + '\n', 'utf8')
  const markdown = [
    '# DSH Playwright real-world test report',
    '',
    `- Generated: ${report.generatedAt}`,
    `- Installed plugin: ${pluginPath}`,
    `- Overall: ${report.ok ? 'PASS' : 'FAIL'}`,
    `- Tool calls: ${events.length}`,
    '',
    '## Cases',
    '',
    '| Case | Status | Duration | Evidence |',
    '|---|---:|---:|---|',
    ...cases.map(item => `| ${item.id} | ${item.status.toUpperCase()} | ${item.durationMs} ms | ${item.status === 'passed' ? JSON.stringify(item.evidence) : item.error} |`),
    '',
    '## Sanitized tool timeline',
    '',
    '| # | Case | Tool | Duration | Arguments | Result |',
    '|---:|---|---|---:|---|---|',
    ...events.map(event => {
      const result = event.result.isError
        ? `ERROR: ${event.result.error}`
        : [event.result.title, event.result.url, event.result.path, event.result.tabs === undefined ? undefined : `tabs=${event.result.tabs.length}`].filter(Boolean).join(' · ') || 'OK'
      return `| ${event.sequence} | ${event.caseId} | ${event.tool} | ${event.durationMs} ms | \`${JSON.stringify(event.arguments).replaceAll('|', '\\|')}\` | ${String(result).replaceAll('|', '\\|')} |`
    }),
    '',
    `Raw sanitized JSONL: ${eventLogPath}`,
    '',
  ].join('\n')
  await writeFile(markdownReportPath, markdown, 'utf8')
  process.stdout.write(JSON.stringify(report) + '\n')
}

if (cases.some(item => item.status !== 'passed')) process.exitCode = 1
