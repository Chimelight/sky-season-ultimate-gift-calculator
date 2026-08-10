import { useRef, useEffect, useMemo } from 'react'
import { useTheme } from 'next-themes'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useI18n } from '@/context/I18nContext'
import { shortName } from '@/lib/helpers'
import type { Rules, Spirit } from '@/data/seasons'
import type { SolveResult, Pick } from '@/lib/solver'

function renderSvg(
  best: SolveResult['best'],
  completedMap: Map<number, { orderInPlan: number; strat: Pick['strat'] }>,
  spirits: { name: string }[],
  rules: { heart: number },
  labels: { lv5: string; lv4: string; lv3: string; lv2: string; lv1: string; heart: (c: number) => string; buyCell: (c: string) => string; skipCell: (c: string, d: number) => string },
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
    // A 3-item level yields strings like "10+20+30C" that overrun the column at
    // the nominal size, so step down until the widest line fits.
    const widestAt = (size: number) => {
      ctx.font = `${size}px sans-serif`
      return Math.max(...lines.map(l => ctx.measureText(l).width))
    }
    while (fs > 7 && widestAt(fs) > cw - 6) fs -= 0.5
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
      if (!opt || opt.k === 'none') continue

      const buyLabel = labels.buyCell(opt.buys.join('+'))
      const skipLabel = labels.skipCell(opt.skips.join('+'), opt.days)

      if (opt.buys.length && opt.skips.length) {
        const gap = 2, subW = (cw - gap) / 2
        svg += cell(x, y, subW, ch, 'buy', buyLabel, 9)
        svg += cell(x + subW + gap, y, subW, ch, 'skip', skipLabel, 9)
      } else if (opt.buys.length) {
        svg += cell(x, y, cw, ch, 'buy', buyLabel)
      } else if (opt.skips.length) {
        svg += cell(x, y, cw, ch, 'skip', skipLabel)
      }
    }
  })

  svg += '</svg>'
  return svg
}

export function TreeMap({ result, spirits, rules }: { result: SolveResult; spirits: Spirit[]; rules: Rules }) {
  const { t } = useI18n()
  const { resolvedTheme } = useTheme()
  const { best } = result
  const containerRef = useRef<HTMLDivElement>(null)

  const completedMap = useMemo(
    () => new Map(best.picks.map((p, pi) => [p.spiritIdx, { orderInPlan: best.order.indexOf(pi), strat: p.strat }])),
    [best]
  )

  useEffect(() => {
    if (!containerRef.current) return
    const isDark = resolvedTheme === 'dark'
    const svg = renderSvg(
      best,
      completedMap,
      spirits,
      rules,
      {
        lv5: t('svg_lv5'), lv4: t('svg_lv4'), lv3: t('svg_lv3'), lv2: t('svg_lv2'), lv1: t('svg_lv1'),
        heart: (c) => t('svg_heart', { c }),
        buyCell: (c) => t('svg_buy_cell', { c }),
        skipCell: (c, d) => d > 0 ? t('svg_skip_cell', { c, d }) : t('svg_skip_cell_free', { c }),
      },
      isDark
    )
    containerRef.current.innerHTML = svg
  }, [best, completedMap, spirits, rules, resolvedTheme, t])

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">{t('section_treemap')}</h3>
      <Card>
        <CardContent className="pt-4 pb-4 space-y-3">
          <div className="relative">
            <div ref={containerRef} className="overflow-x-auto" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-card to-transparent @[32rem]:hidden" />
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
