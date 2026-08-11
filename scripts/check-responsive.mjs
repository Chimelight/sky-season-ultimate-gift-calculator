#!/usr/bin/env node
/**
 * Responsive regression checker.
 *
 * Boots the Vite dev server and a headless Chromium, iterates a
 * (viewport × language) matrix, and asserts:
 *   1. No horizontal page overflow (scrollWidth > innerWidth) for widths ≥ 280px.
 *   2. No text-truncation ellipsis on user content (spirit name inputs,
 *      strategy spirit names, badges) — i.e. scrollWidth ≤ clientWidth
 *      for elements that must never clip.
 *
 * Fails loudly with a PNG + console diagnostic per failed cell.
 * Exits non-zero on any failure.
 */
import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import { setTimeout as sleep } from 'node:timers/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SNAPSHOT_DIR = path.join(__dirname, '__snapshots__')

const VIEWPORTS = [280, 360, 480, 640, 768, 1024, 1440, 1920]
const LANGS = ['en', 'zh-CN']
const BASE_URL = process.env.BASE_URL || 'http://localhost:5173'

const startDev = () => {
  const proc = spawn('npm', ['run', 'dev', '--', '--port', '5173'], {
    cwd: path.resolve(__dirname, '..'),
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, BROWSER: 'none' },
  })
  return proc
}

const waitForServer = async (url, timeoutMs = 30000) => {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url)
      if (res.ok) return
    } catch {}
    await sleep(300)
  }
  throw new Error(`Dev server did not come up at ${url}`)
}

const assertNoOverflow = async (page, viewport) => {
  if (viewport < 280) return [] // honest floor — horizontal scroll is allowed
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement
    return doc.scrollWidth - window.innerWidth
  })
  return overflow > 1
    ? [`page scroll: scrollWidth exceeds innerWidth by ${overflow}px`]
    : []
}

const assertNoClip = async (page) => {
  const issues = await page.evaluate(() => {
    const selectors = [
      'h1',                     // Header title
      '[class*="Badge"]',       // badges (best-effort; we use variant class matches below)
      '.badge',
    ]
    // Collect all Badge-like elements by variant class fragments.
    const badgeNodes = Array.from(
      document.querySelectorAll('[class*="bg-green-50"], [class*="bg-amber-50"], [class*="bg-primary/10"]')
    )
    const headingNodes = Array.from(document.querySelectorAll('h1, h2'))
    const nameInputs = Array.from(document.querySelectorAll('input.font-medium'))
    const problems = []
    for (const el of [...badgeNodes, ...headingNodes]) {
      if (el.scrollWidth - el.clientWidth > 1) {
        problems.push({
          tag: el.tagName,
          text: (el.textContent || '').slice(0, 40),
          scrollW: el.scrollWidth,
          clientW: el.clientWidth,
        })
      }
    }
    for (const input of nameInputs) {
      if (input.scrollWidth - input.clientWidth > 2) {
        problems.push({
          tag: 'INPUT',
          text: (input.value || '').slice(0, 40),
          scrollW: input.scrollWidth,
          clientW: input.clientWidth,
        })
      }
    }
    return problems
  })
  return issues.map(i => `clip: <${i.tag}> "${i.text}" (${i.scrollW} > ${i.clientW})`)
}

const setLang = async (page, lang) => {
  // Language stored in localStorage by I18nContext under key "lang"
  await page.evaluate(l => localStorage.setItem('lang', l), lang)
  await page.reload({ waitUntil: 'domcontentloaded' })
}

const run = async () => {
  await mkdir(SNAPSHOT_DIR, { recursive: true })
  const dev = startDev()
  let devFailed = false
  dev.stderr.on('data', d => process.stderr.write(`[vite] ${d}`))
  dev.on('exit', code => { if (code && code !== 0 && code !== null) devFailed = true })

  try {
    await waitForServer(BASE_URL)
    const browser = await chromium.launch()
    const failures = []
    for (const lang of LANGS) {
      const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } })
      const page = await ctx.newPage()
      // Not networkidle: the solver worker's module request never settles in
      // Playwright's network log, so idle never fires. Wait for the app to have
      // actually painted a result instead — a truer readiness signal anyway.
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' })
      await setLang(page, lang)
      await page.waitForSelector('table tbody tr', { timeout: 15000 })
      for (const width of VIEWPORTS) {
        await page.setViewportSize({ width, height: 900 })
        await sleep(150) // allow container queries to settle
        const issues = [
          ...(await assertNoOverflow(page, width)),
          ...(await assertNoClip(page)),
        ]
        if (issues.length) {
          const snap = path.join(SNAPSHOT_DIR, `${width}-${lang}.png`)
          await page.screenshot({ path: snap, fullPage: true })
          failures.push({ width, lang, issues, snap })
        }
      }
      await ctx.close()
    }
    await browser.close()

    if (failures.length) {
      console.error(`\nResponsive regression FAILED: ${failures.length} cell(s)`)
      for (const f of failures) {
        console.error(`  [${f.width}px · ${f.lang}] — screenshot: ${f.snap}`)
        for (const i of f.issues) console.error(`    - ${i}`)
      }
      process.exitCode = 1
    } else {
      console.log(`Responsive regression OK across ${VIEWPORTS.length}×${LANGS.length} cells.`)
    }
  } finally {
    dev.kill('SIGTERM')
    if (devFailed) process.exitCode = process.exitCode || 1
  }
}

run().catch(e => {
  console.error(e)
  process.exit(1)
})
