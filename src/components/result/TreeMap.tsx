import { useRef, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useI18n } from '@/context/I18nContext'
import { useAppState } from '@/context/StateContext'
import { shortName } from '@/lib/helpers'
import type { SolveResult, Pick } from '@/lib/solver'

function renderSvg(
  best: SolveResult['best'],
  completedMap: Map<number, { orderInPlan: number; strat: Pick['strat'] }>,
  spirits: { name: string }[],
  rules: { heart: number },
  labels: { lv5: string; lv4: string; lv3: string; lv2: string; lv1: string; heart: (c: number) => string; buyLine: (c: number) => string; skipLine: (c: number, d: number) => string; skipDays: (d: number) => string; buyBoth: (a: number, b: number) => string; skipBothDays: (d: number) => string },
  isDark: boolean
): string {
  const usedIdxs = best.order.map(pi => best.picks[pi].spiritIdx)
  const Nu = usedIdxs.length
  if (Nu === 0) return ''

  const colWmin = 120
  const w = Math.max(320, 100 + Nu * colWmin)
  const rowH = 54, topPad = 24
  const levelLabels = [labels.lv5, labels.lv4, labels.lv3, labels.lv2, labels.lv1]

  const cvs = document.createElement('canvas')
  const ctx = cvs.getContext('2d')!
  ctx.font = '12px sans-serif'
  const leftPad = Math.ceil(Math.max(...levelLabels.map(l => ctx.measureText(l).width))) + 16
  const colW = (w - leftPad - 16) / Nu
  const h = topPad + rowH * 5 + 16

  const textPrimary = isDark ? '#e8e6de' : '#1a1a1a'
  const textMuted = isDark ? '#888880' : '#6b7280'

  const buyFill = isDark ? '#14250a' : '#f0fdf4'
  const buyStroke = isDark ? '#166534' : '#16a34a'
  const buyText = isDark ? '#86efac' : '#15803d'
  const skipFill = isDark ? '#2a1a00' : '#fffbeb'
  const skipStroke = isDark ? '#92400e' : '#d97706'
  const skipText = isDark ? '#fcd34d' : '#b45309'

  let svg = `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" style="width:100%;display:block;">`

  for (let li = 0; li < 5; li++) {
    const y = topPad + li * rowH + rowH / 2 + 4
    svg += `<text x="8" y="${y}" style="font-size:12px;fill:${textMuted};">${levelLabels[li]}</text>`
  }

  function cell(x: number, y: number, cw: number, ch: number, kind: 'buy' | 'skip', text: string, fs = 11) {
    const fill = kind === 'buy' ? buyFill : skipFill
    const stroke = kind === 'buy' ? buyStroke : skipStroke
    const txt = kind === 'buy' ? buyText : skipText
    const lines = text.split('\n')
    let out = `<rect x="${x}" y="${y}" width="${cw}" height="${ch}" rx="5" fill="${fill}" stroke="${stroke}" stroke-opacity="0.6" stroke-width="0.8"/>`
    const lineH = fs * 1.2
    lines.forEach((line, idx) => {
      const lineY = y + ch / 2 + fs * 0.36 + (idx - (lines.length - 1) / 2) * lineH
      out += `<text x="${x + cw / 2}" y="${lineY}" text-anchor="middle" style="font-size:${fs}px;fill:${txt};">${line}</text>`
    })
    return out
  }

  usedIdxs.forEach((spIdx, col) => {
    const sp = spirits[spIdx]
    const info = completedMap.get(spIdx)!
    const xc = leftPad + colW * col + colW / 2
    svg += `<text x="${xc}" y="16" text-anchor="middle" style="font-size:12px;font-weight:500;fill:${textPrimary};">#${col + 1} ${shortName(sp.name, spIdx)}</text>`

    const opts = info.strat.opts
    for (let li = 0; li < 5; li++) {
      const x = leftPad + colW * col + 6
      const y = topPad + li * rowH + 6
      const cw = colW - 12, ch = rowH - 12

      if (li === 0) {
        svg += cell(x, y, cw, ch, 'buy', labels.heart(rules.heart))
        continue
      }

      const opt = opts[4 - li]
      if (!opt || (opt.buys.length === 0 && opt.skips.length === 0 && opt.k === 'none')) continue

      if (opt.k === 'cheap' || opt.k === 'exp') {
        const gap = 2, subW = (cw - gap) / 2
        svg += cell(x, y, subW, ch, 'buy', labels.buyLine(opt.buys[0]), 9)
        svg += cell(x + subW + gap, y, subW, ch, 'skip', labels.skipLine(opt.skips[0], opt.days), 9)
      } else if (opt.k === 'buy') {
        svg += cell(x, y, cw, ch, 'buy', `Buy ${opt.buys[0]}C`)
      } else if (opt.k === 'skip') {
        svg += cell(x, y, cw, ch, 'skip', labels.skipDays(opt.days))
      } else if (opt.k === 'both') {
        svg += cell(x, y, cw, ch, 'buy', labels.buyBoth(opt.buys[0], opt.buys[1]))
      } else if (opt.k === 'skipboth') {
        svg += cell(x, y, cw, ch, 'skip', labels.skipBothDays(opt.days))
      }
    }
  })

  svg += '</svg>'
  return svg
}

export function TreeMap({ result }: { result: SolveResult }) {
  const { t } = useI18n()
  const { state } = useAppState()
  const { resolvedTheme } = useTheme()
  const { best } = result
  const containerRef = useRef<HTMLDivElement>(null)

  const completedMap = new Map(
    best.picks.map((p, pi) => [p.spiritIdx, { orderInPlan: best.order.indexOf(pi), strat: p.strat }])
  )

  useEffect(() => {
    if (!containerRef.current) return
    const isDark = resolvedTheme === 'dark'
    const svg = renderSvg(
      best,
      completedMap,
      state.spirits,
      state.rules,
      {
        lv5: t('svg_lv5'), lv4: t('svg_lv4'), lv3: t('svg_lv3'), lv2: t('svg_lv2'), lv1: t('svg_lv1'),
        heart: (c) => t('svg_heart', { c }),
        buyLine: (c) => t('svg_buy_line', { c }),
        skipLine: (c, d) => t('svg_skip_line', { c, d }),
        skipDays: (d) => t('svg_skip_days', { d }),
        buyBoth: (a, b) => t('svg_buy_both', { a, b }),
        skipBothDays: (d) => t('svg_skip_both_days', { d }),
      },
      isDark
    )
    containerRef.current.innerHTML = svg
  })

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">{t('section_treemap')}</h3>
      <Card>
        <CardContent className="pt-4 pb-4 space-y-3">
          <div className="relative">
            <div ref={containerRef} className="overflow-x-auto" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-card to-transparent sm:hidden" />
          </div>
          <div className="flex gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Badge variant="buy" className="px-1.5 py-0">■</Badge>
              {t('legend_buy')}
            </span>
            <span className="flex items-center gap-1">
              <Badge variant="skip" className="px-1.5 py-0">■</Badge>
              {t('legend_skip')}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
