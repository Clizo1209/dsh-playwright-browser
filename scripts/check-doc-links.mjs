import { access, readdir, readFile } from 'node:fs/promises'
import { dirname, extname, resolve } from 'node:path'

const root = resolve('.')
const ignoredSegments = new Set(['.dsh-browser', '.dsh-e2e-home', '.git', '.local', 'lib', 'node_modules'])
const ignoredBasenames = new Set(['findings.md', 'progress.md', 'task_plan.md'])
const entries = await readdir(root, { recursive: true, withFileTypes: true })
const markdownFiles = entries
  .filter(entry => entry.isFile() && extname(entry.name) === '.md')
  .map(entry => resolve(entry.parentPath, entry.name))
  .filter(path => !path.slice(root.length + 1).split('/').some(segment => ignoredSegments.has(segment)))
  .filter(path => !ignoredBasenames.has(path.split('/').at(-1) ?? ''))

const failures = []
for (const file of markdownFiles) {
  const source = await readFile(file, 'utf8')
  const links = source.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)
  for (const match of links) {
    const raw = match[1]?.trim()
    if (raw === undefined || raw.length === 0 || /^(?:https?:|mailto:|#)/.test(raw)) continue
    const target = decodeURIComponent(raw.replace(/^<|>$/g, '').split('#', 1)[0] ?? '')
    if (target.length === 0) continue
    try {
      await access(resolve(dirname(file), target))
    } catch {
      failures.push(`${file.slice(root.length + 1)} -> ${raw}`)
    }
  }
}

if (failures.length > 0) {
  process.stderr.write(`Broken local Markdown links:\n${failures.map(item => `- ${item}`).join('\n')}\n`)
  process.exitCode = 1
} else {
  process.stdout.write(`Checked ${markdownFiles.length} Markdown files; local links are valid.\n`)
}
