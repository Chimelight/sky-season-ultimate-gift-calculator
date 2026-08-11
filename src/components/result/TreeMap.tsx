import { useRef, useEffect, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge, Dot } from '@/components/ui/badge'
import { useI18n } from '@/context/I18nContext'
import { shortName } from '@/lib/helpers'
import { SPIRIT_RAMPS } from '@/lib/spiritTheme'
import type { Rules, Spirit } from '@/data/seasons'
import type { SolveResult, Pick } from '@/lib/solver'

function renderSvg(
  best: SolveResult['best'],
  completedMap: Map<number, { orderInPlan: number; strat: Pick['strat'] }>,
  spirits: { name: string }[],
  rules: { heart: number },
  labels: { lv5: string; lv4: string; lv3: string; lv2: string; lv1: string; heart: (c: number) => string; buyCell: (c: string) => string; skipCell: (c: string, d: number) => string }
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

  // Colours come from the same CSS variables the rest of the app uses, read
  // through `style` so they resolve live. That is why this no longer takes a
  // theme: the SVG can no longer disagree with the page it sits on.
  const textMuted = 'hsl(var(--muted-foreground))'

  let svg = `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" style="width:100%;display:block;">`

  for (let li = 0; li < 5; li++) {
    const y = topPad + li * rowH + rowH / 2 + 4
    svg += `<text x="8" y="${y}" style="font-size:12px;fill:${textMuted};">${levelLabels[li]}</text>`
  }

  /**
   * `n` is the spirit's ramp number. Buy is a solid fill, skip is unfilled with
   * a dashed edge — the same "owned vs given up" distinction the badges make,
   * and one that survives without colour.
   */
  function cell(x: number, y: number, cw: number, ch: number, kind: 'buy' | 'skip', n: number, text: string, fs = 11) {
    const fill = kind === 'buy' ? `var(--s${n}-bg)` : 'none'
    const stroke = `var(--s${n}-br)`
    const dash = kind === 'buy' ? '' : 'stroke-dasharray:3 2;'
    const txt = `var(--s${n}-fg)`
    const lines = text.split('\n')
    // A 3-item level yields strings like "10+20+30C" that overrun the column at
    // the nominal size, so step down until the widest line fits.
    const widestAt = (size: number) => {
      ctx.font = `${size}px sans-serif`
      return Math.max(...lines.map(l => ctx.measureText(l).width))
    }
    while (fs > 7 && widestAt(fs) > cw - 6) fs -= 0.5
    let out = `<rect x="${x}" y="${y}" width="${cw}" height="${ch}" rx="5" style="fill:${fill};stroke:${stroke};${dash}stroke-width:1;"/>`
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
    const n = (spIdx % SPIRIT_RAMPS) + 1
    const xc = leftPad + colW * col + colW / 2
    // The heading carries the spirit's colour so the column is identifiable
    // before reading it; the number stays plan order, as everywhere else.
    svg += `<text x="${xc}" y="16" text-anchor="middle" style="font-size:12px;font-weight:600;fill:var(--s${n}-fg);">#${col + 1} ${shortName(sp.name, spIdx)}</text>`

    const opts = info.strat.opts
    for (let li = 0; li < 5; li++) {
      const x = leftPad + colW * col + 6
      const y = topPad + li * rowH + 6
      const cw = colW - 12, ch = rowH - 12

      if (li === 0) {
        svg += cell(x, y, cw, ch, 'buy', n, labels.heart(rules.heart))
        continue
      }

      const opt = opts[4 - li]
      if (!opt || opt.k === 'none') continue

      const buyLabel = labels.buyCell(opt.buys.join('+'))
      const skipLabel = labels.skipCell(opt.skips.join('+'), opt.days)

      if (opt.buys.length && opt.skips.length) {
        const gap = 2, subW = (cw - gap) / 2
        svg += cell(x, y, subW, ch, 'buy', n, buyLabel, 9)
        svg += cell(x + subW + gap, y, subW, ch, 'skip', n, skipLabel, 9)
      } else if (opt.buys.length) {
        svg += cell(x, y, cw, ch, 'buy', n, buyLabel)
      } else if (opt.skips.length) {
        svg += cell(x, y, cw, ch, 'skip', n, skipLabel)
      }
    }
  })

  svg += '</svg>'
  return svg
}

export function TreeMap({ result, spirits, rules }: { result: SolveResult; spirits: Spirit[]; rules: Rules }) {
  const { t } = useI18n()
  const { best } = result
  const containerRef = useRef<HTMLDivElement>(null)

  const completedMap = useMemo(
    () => new Map(best.picks.map((p, pi) => [p.spiritIdx, { orderInPlan: best.order.indexOf(pi), strat: p.strat }])),
    [best]
  )

  useEffect(() => {
    if (!containerRef.current) return
    const svg = renderSvg(best, completedMap, spirits, rules, {
      lv5: t('svg_lv5'), lv4: t('svg_lv4'), lv3: t('svg_lv3'), lv2: t('svg_lv2'), lv1: t('svg_lv1'),
      heart: (c) => t('svg_heart', { c }),
      buyCell: (c) => t('svg_buy_cell', { c }),
      skipCell: (c, d) => d > 0 ? t('svg_skip_cell', { c, d }) : t('svg_skip_cell_free', { c }),
    })
    containerRef.current.innerHTML = svg
  }, [best, completedMap, spirits, rules, t])

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">{t('section_treemap')}</h3>
      <Card>
        <CardContent className="pt-4 pb-4 space-y-3">
          <div className="relative">
            <div ref={containerRef} className="overflow-x-auto" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-card to-transparent @[32rem]:hidden" />
          </div>
          {/* Neutral ramp: the legend explains fill vs outline, and pinning it
              to one spirit's hue would imply the distinction is that spirit's. */}
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground [--sp-bg:hsl(var(--muted))] [--sp-br:hsl(var(--border))] [--sp-fg:hsl(var(--foreground))]">
            <span className="flex items-center gap-1">
              <Badge variant="buy" className="gap-1"><Dot filled />{t('legend_buy')}</Badge>
            </span>
            <span className="flex items-center gap-1">
              <Badge variant="skip" className="gap-1"><Dot filled={false} />{t('legend_skip')}</Badge>
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
