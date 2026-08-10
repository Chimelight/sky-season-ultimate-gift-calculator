import { Fragment, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { useI18n } from '@/context/I18nContext'
import { useAppState } from '@/context/StateContext'
import { addDays } from '@/lib/helpers'
import { buildSchedule, formatFriendship } from '@/lib/schedule'
import type { Step } from '@/lib/schedule'
import type { SolveResult } from '@/lib/solver'

// Numbers are coloured by flow direction, which is a different axis from the
// badges: a badge says what the event was, these say which way the value moved.
// A purchase row therefore reads green badge / red candles / green friendship —
// bought something, candles left, friendship arrived.
const GAIN = 'text-green-700 dark:text-green-400'
const SPEND = 'text-rose-700 dark:text-rose-400'

export function DailyTable({ result }: { result: SolveResult }) {
  const { t, ordinal, formatDate } = useI18n()
  const { state } = useAppState()

  const rows = useMemo(() => buildSchedule(result, state.rules), [result, state.rules])

  function dayDate(n: number) {
    try { return formatDate(addDays(state.startDate, n - 1)) } catch { return '—' }
  }
  const spiritName = (i: number) => state.spirits[i]?.name || t('spirit_name_default', { n: i + 1 })

  function eventBadge(s: Step) {
    if (s.kind === 'collect') return <Badge variant="secondary">{t('step_collect')}</Badge>
    if (s.kind === 'invite') return <Badge variant="skip">{t('step_invite', { lv: s.lvl })}</Badge>
    if (s.kind === 'heart') return <Badge variant="buy">{t('badge_item_heart', { c: -s.candles })}</Badge>
    return <Badge variant="buy">{t('badge_item_buy', { lv: s.lvl, c: -s.candles })}</Badge>
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">{t('section_daily')}</h3>
      <div className="overflow-x-auto -mx-4 px-4">
        <table className="w-full min-w-[48rem] text-sm border-collapse">
          <thead>
            <tr className="border-b text-xs text-muted-foreground">
              <th className="text-left font-medium py-2 pr-2 align-bottom whitespace-nowrap">{t('th_day')}</th>
              <th className="text-left font-medium py-2 px-2 align-bottom">{t('th_spirit')}</th>
              <th className="text-left font-medium py-2 px-2 align-bottom">{t('th_event')}</th>
              <th className="text-right font-medium py-2 px-2 align-bottom whitespace-nowrap">{t('th_candles')}</th>
              <th className="text-right font-medium py-2 px-2 align-bottom whitespace-nowrap">{t('th_balance')}</th>
              <th className="text-left font-medium py-2 px-2 align-bottom whitespace-nowrap">{t('th_friendship')}</th>
              <th className="text-left font-medium py-2 pl-2 align-bottom">{t('th_events')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <Fragment key={r.day}>
                {r.steps.map((s, i) => {
                  const notable = s.completes || s.ultimates.length > 0
                  // Repeat the spirit only when it changes; the date spans the day.
                  const sameSpirit = i > 0 && r.steps[i - 1].spiritIdx === s.spiritIdx
                  return (
                    <tr
                      key={i}
                      className={`align-middle ${i === r.steps.length - 1 ? 'border-b' : ''} ${notable ? 'bg-muted/40' : ''}`}
                    >
                      {i === 0 && (
                        <td rowSpan={r.steps.length} className="py-1.5 pr-2 align-top whitespace-nowrap border-r">
                          <div className="font-medium tabular-nums">{t('day_prefix', { n: r.day })}</div>
                          <div className="text-xs text-muted-foreground">{dayDate(r.day)}</div>
                        </td>
                      )}
                      <td className="py-1.5 px-2 text-xs text-muted-foreground wrap-anywhere break-words">
                        {s.spiritIdx === null || sameSpirit ? '' : spiritName(s.spiritIdx)}
                      </td>
                      <td className="py-1.5 px-2">
                        <div className="flex flex-wrap items-center gap-1">
                          {eventBadge(s)}
                          {s.skips.map((sk, k) => (
                            <Badge key={`sk${k}`} variant="skip">
                              {t('badge_item_skip', { lv: sk.lvl, c: sk.cost })}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="py-1.5 px-2 text-right tabular-nums text-xs whitespace-nowrap">
                        {s.candles > 0 ? (
                          <span className={GAIN}>+{s.candles}</span>
                        ) : s.candles < 0 ? (
                          <span className={SPEND}>−{-s.candles}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-1.5 px-2 text-right tabular-nums text-xs whitespace-nowrap">
                        <span className={s.balance === 0 ? 'text-muted-foreground' : ''}>{s.balance}</span>
                      </td>
                      <td className="py-1.5 px-2 text-xs whitespace-nowrap">
                        {s.gain > 0 ? (
                          <span className="tabular-nums">
                            <span className={GAIN}>
                              {t('step_gain', { gain: formatFriendship(s.gain) })}
                            </span>
                            <span className="text-muted-foreground mx-1">→</span>
                            <span>
                              {t('step_progress', {
                                after: formatFriendship(s.after),
                                req: s.required,
                              })}
                            </span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-1.5 pl-2">
                        <div className="flex flex-wrap gap-1">
                          {s.kind === 'collect' && r.day === 1 && state.rules.pass > 0 && (
                            <Badge variant="secondary">{t('badge_pass', { pass: state.rules.pass })}</Badge>
                          )}
                          {s.cleared.map(lv => (
                            <Badge key={`cl${lv}`} variant="order">{t('step_cleared', { lv })}</Badge>
                          ))}
                          {s.completes && s.spiritIdx !== null && (
                            <Badge variant="buy">{t('badge_spirit_done', { name: spiritName(s.spiritIdx) })}</Badge>
                          )}
                          {s.ultimates.map(ui => (
                            <Badge key={`u${ui}`} variant="default">
                              {t('badge_ult_ready', { ord: ordinal(ui + 1) })}
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
