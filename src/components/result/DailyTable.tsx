import { Fragment, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { useI18n } from '@/context/I18nContext'
import { useAppState } from '@/context/StateContext'
import { addDays } from '@/lib/helpers'
import { buildSchedule, formatFriendship } from '@/lib/schedule'
import { spiritClass } from '@/lib/spiritTheme'
import { FriendshipBar } from './FriendshipBar'
import type { Step } from '@/lib/schedule'
import type { Rules, Spirit } from '@/data/seasons'
import type { SolveResult } from '@/lib/solver'

// Candles are the one column with a direction, and it is the same direction for
// every spirit, so it keeps a fixed pair rather than the identity ramp. Rose
// appears nowhere else, so it never reads as an error the way `destructive`
// would. Friendship needs no colour of its own — its gain is already drawn on
// the bar in the spirit's own hue.
const GAIN = 'text-green-700 dark:text-green-400'
const SPEND = 'text-rose-700 dark:text-rose-400'

export function DailyTable({ result, spirits, rules }: { result: SolveResult; spirits: Spirit[]; rules: Rules }) {
  const { t, ordinal, formatDate } = useI18n()
  const { state } = useAppState()

  const rows = useMemo(() => buildSchedule(result, rules), [result, rules])

  // Which season day is today. A returning player opens this table to find
  // exactly one thing — where am I now — so mark it rather than making them
  // count dates. Null whenever today falls outside the plan.
  const todayDay = useMemo(() => {
    const [y, m, d] = state.startDate.split('-').map(Number)
    if (!y || !m || !d) return null
    const now = new Date()
    const diff = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - Date.UTC(y, m - 1, d)
    return Math.floor(diff / 86_400_000) + 1
  }, [state.startDate])

  function dayDate(n: number) {
    try { return formatDate(addDays(state.startDate, n - 1)) } catch { return '—' }
  }
  const spiritName = (i: number) => spirits[i]?.name || t('spirit_name_default', { n: i + 1 })

  // Hue says which spirit; weight says which of the two friendship sources
  // paid for it. Candles bought it (reversed block) or a day did (quiet block).
  function eventBadge(s: Step) {
    if (s.kind === 'collect') return <Badge variant="secondary">{t('step_collect')}</Badge>
    if (s.kind === 'invite') return <Badge variant="soft">{t('step_invite', { lv: s.lvl })}</Badge>
    return (
      <Badge variant="buy">
        {s.kind === 'heart'
          ? t('badge_item_heart', { c: -s.candles })
          : t('badge_item_buy', { lv: s.lvl, c: -s.candles })}
      </Badge>
    )
  }

  return (
    <div className="space-y-2">
      <h3 id="daily-heading" className="text-sm font-semibold">{t('section_daily')}</h3>
      <div className="overflow-x-auto -mx-4 px-4">
        <table aria-labelledby="daily-heading" className="w-full min-w-[48rem] text-sm border-collapse">
          <thead>
            <tr className="border-b text-xs text-muted-foreground">
              <th scope="col" className="text-left font-medium py-2 pr-2 align-bottom whitespace-nowrap">{t('th_day')}</th>
              <th scope="col" className="text-left font-medium py-2 px-2 align-bottom">{t('th_spirit')}</th>
              <th scope="col" className="text-left font-medium py-2 px-2 align-bottom">{t('th_event')}</th>
              <th scope="col" className="text-right font-medium py-2 px-2 align-bottom whitespace-nowrap">{t('th_candles')}</th>
              <th scope="col" className="text-right font-medium py-2 px-2 align-bottom whitespace-nowrap">{t('th_balance')}</th>
              <th scope="col" className="text-left font-medium py-2 px-2 align-bottom whitespace-nowrap">{t('th_friendship')}</th>
              <th scope="col" className="text-left font-medium py-2 pl-2 align-bottom">{t('th_events')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <Fragment key={r.day}>
                {r.steps.map((s, i) => {
                  const isToday = r.day === todayDay
                  // Repeat the spirit only when it changes; the date spans the day.
                  const sameSpirit = i > 0 && r.steps[i - 1].spiritIdx === s.spiritIdx
                  const ramp = spiritClass(s.spiritIdx)
                  return (
                    <tr
                      key={i}
                      // Today is marked once, on the date cell that spans the
                      // whole day — never per row, which would draw rules
                      // between the steps *inside* the day.
                      className={`align-middle ${ramp} ${i === r.steps.length - 1 ? 'border-b' : ''} ${
                        s.spiritIdx === null ? '' : 'bg-[var(--sp-bg)]'
                      }`}
                    >
                      {i === 0 && (
                        <td
                          rowSpan={r.steps.length}
                          className={`py-1 pr-2 align-top whitespace-nowrap border-r ${
                            isToday ? 'border-l-2 border-l-primary pl-2' : ''
                          }`}
                        >
                          <div className="font-medium tabular-nums">{t('day_prefix', { n: r.day })}</div>
                          <div className="text-xs text-muted-foreground">{dayDate(r.day)}</div>
                          {isToday && (
                            <Badge variant="default" className="mt-0.5">{t('badge_today')}</Badge>
                          )}
                        </td>
                      )}
                      <td className="py-1 px-2 text-xs wrap-anywhere break-words">
                        {/* The swatch, not a number: #N elsewhere means order in
                            the plan, and a second numbering here would compete
                            with it. Colour alone identifies the spirit, and the
                            name beside it is the non-colour fallback. */}
                        {s.spiritIdx === null || sameSpirit ? null : (
                          <span className="flex items-center gap-1.5 min-w-0">
                            <span
                              aria-hidden="true"
                              className="size-2 shrink-0 rounded-[2px] bg-[var(--sp-bar)]"
                            />
                            <span className="text-[var(--sp-fg)] wrap-anywhere break-words">
                              {spiritName(s.spiritIdx)}
                            </span>
                          </span>
                        )}
                      </td>
                      <td className="py-1 px-2">
                        <div className="flex flex-wrap items-center gap-1">
                          {eventBadge(s)}
                          {s.skips.map((sk, k) => (
                            <Badge key={`sk${k}`} variant="skip">
                              {t('badge_item_skip', { lv: sk.lvl, c: sk.cost })}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="py-1 px-2 text-right tabular-nums text-xs whitespace-nowrap">
                        {s.candles > 0 ? (
                          <span className={GAIN}>+{s.candles}</span>
                        ) : s.candles < 0 ? (
                          <span className={SPEND}>−{-s.candles}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-1 px-2 text-right tabular-nums text-xs whitespace-nowrap">
                        <span className={s.balance === 0 ? 'text-muted-foreground' : ''}>{s.balance}</span>
                      </td>
                      <td className="py-1 px-2 text-xs whitespace-nowrap">
                        {s.gain > 0 ? (
                          <span className="flex flex-col gap-0.5 min-w-[7rem]">
                            <span className="tabular-nums flex items-baseline gap-1">
                              <span>
                                {t('step_progress', {
                                  after: formatFriendship(s.after),
                                  req: formatFriendship(s.total),
                                })}
                              </span>
                              <span className="text-[var(--sp-fg)] font-semibold">
                                {t('step_gain', { gain: formatFriendship(s.gain) })}
                              </span>
                            </span>
                            <FriendshipBar after={s.after} gain={s.gain} total={s.total} marks={s.marks} />
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-1 pl-2">
                        <div className="flex flex-wrap gap-1">
                          {s.kind === 'collect' && r.day === 1 && rules.pass > 0 && (
                            <Badge variant="secondary">{t('badge_pass', { pass: rules.pass })}</Badge>
                          )}
                          {s.cleared.map(lv => (
                            <Badge key={`cl${lv}`} variant="order">{t('step_cleared', { lv })}</Badge>
                          ))}
                          {s.completes && s.spiritIdx !== null && (
                            <Badge variant="milestone">{t('badge_spirit_done', { name: spiritName(s.spiritIdx) })}</Badge>
                          )}
                          {s.ultimates.map(ui => (
                            <Badge key={`u${ui}`} variant="ult">
                              ★ {t('badge_ult_ready', { ord: ordinal(ui + 1) })}
                            </Badge>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">{t('note_daily')}</p>
    </div>
  )
}
