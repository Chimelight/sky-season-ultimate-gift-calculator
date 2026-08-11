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

  // #N is position in the plan, the same number the strategy table and tree map
  // use — not the spirit's index in the season, which would be a second, silently
  // different numbering for the same spirits.
  const planOrder = useMemo(() => {
    const m = new Map<number, number>()
    result.best.order.forEach((pi, k) => m.set(result.best.picks[pi].spiritIdx, k + 1))
    return m
  }, [result])

  // Hue says which spirit; weight says which of the two friendship sources
  // paid for it. Candles bought it (reversed block) or a day did (quiet block).
  function eventBadge(s: Step) {
    if (s.kind === 'collect') return <Badge variant="secondary">{t('step_collect')}</Badge>
    // `s.lvl` still carries the level the spirit is genuinely on, and
    // check-model still pins it — it is just not shown, because it describes
    // the spirit's state rather than the action.
    if (s.kind === 'invite') return <Badge variant="soft">{t('step_invite')}</Badge>
    // font-normal overrides the variant's semibold: in a table this long the
    // emphasis a purchase needs is already carried by its denser ground and
    // darker ink, and bold on top of that turns every buy row into a shout.
    // The strategy table keeps the weight — there the badges *are* the content.
    return (
      <Badge variant="buy" className="font-normal">
        {s.kind === 'heart'
          ? t('badge_item_heart', { c: -s.candles })
          : t('badge_item_buy', { lv: s.lvl, c: -s.candles })}
      </Badge>
    )
  }

  return (
    <div className="space-y-2">
      <h3 id="daily-heading" className="text-sm font-semibold">{t('section_daily')}</h3>
      {/* Badges here never wrap: the table scrolls horizontally, so a wrapped
          two-line badge buys nothing and costs row rhythm — and the badge base
          centres its text, which looks wrong the moment a second line appears. */}
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
                          // An ultimate is reached by the *day*, not by the step
                          // whose row its badge happened to land in, so the
                          // whole marking lives here: gold wash, gold rule, and
                          // the badge itself. Today wins the rule when the two
                          // coincide — that is the marker the table gets opened
                          // for — but the wash and badge stay, so the milestone
                          // is never lost.
                          className={`py-1 pr-2 align-top border-r ${
                            r.ultimates.length > 0 ? 'bg-[var(--ult-day)]' : ''
                          } ${
                            isToday
                              ? 'border-l-2 border-l-primary pl-2'
                              : r.ultimates.length > 0
                                ? 'border-l-2 border-l-[var(--ult-line)] pl-2'
                                : ''
                          }`}
                        >
                          <div className="font-medium tabular-nums whitespace-nowrap">
                            {t('day_prefix', { n: r.day })}
                          </div>
                          <div className="text-xs text-muted-foreground whitespace-nowrap">{dayDate(r.day)}</div>
                          {isToday && (
                            <Badge variant="default" className="mt-0.5">{t('badge_today')}</Badge>
                          )}
                          {/* Short form here: the full phrase is what set this
                              column's width, and the day column pays that on
                              every row of the plan for something a season hits
                              two or three times. The full wording stays in the
                              title, and the gold cell already says "claimable"
                              in colour. */}
                          {r.ultimates.map(ui => (
                            <Badge
                              key={`u${ui}`}
                              variant="ult"
                              className="mt-1 whitespace-nowrap"
                              title={t('badge_ult_ready', { ord: ordinal(ui + 1) })}
                            >
                              ★ {t('badge_ult_short', { ord: ordinal(ui + 1) })}
                            </Badge>
                          ))}
                        </td>
                      )}
                      {/* A rule down the left edge, on every step of the run, so
                          a spirit's block reads as one thing at a glance. #N
                          repeats with it; the name appears only where the spirit
                          changes, since repeating it down a long run is noise. */}
                      <td
                        className={`py-1 px-2 text-xs border-l-[3px] ${
                          s.spiritIdx === null ? 'border-l-transparent' : 'border-l-[var(--sp-fg)]'
                        }`}
                      >
                        {s.spiritIdx === null ? null : (
                          <span className="flex items-center gap-1.5 min-w-0">
                            <Badge variant="identity" className="shrink-0">
                              #{planOrder.get(s.spiritIdx) ?? s.spiritIdx + 1}
                            </Badge>
                            {/* The name sets this column's width rather than
                                wrapping inside it: a name broken across two
                                lines on every row of a run is far noisier than
                                a slightly wider column, and the table already
                                scrolls horizontally if it comes to that. Not
                                truncation — nothing is hidden. */}
                            {!sameSpirit && (
                              <span className="text-[var(--sp-fg)] whitespace-nowrap">
                                {spiritName(s.spiritIdx)}
                              </span>
                            )}
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
                          <span className="flex flex-col gap-0.5 min-w-[9rem]">
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
                          {/* Paired by index: cleared[k] is the threshold just
                              met, unlocked[k] the tier it opened. check-model
                              pins the two arrays to the same length. */}
                          {s.cleared.map((lv, k) => (
                            <Badge key={`lu${lv}`} variant="order" className="font-normal whitespace-nowrap">
                              {t('step_level_up', { from: lv, to: s.unlocked[k] })}
                            </Badge>
                          ))}
                          {s.completes && s.spiritIdx !== null && (
                            <Badge variant="milestone" className="whitespace-nowrap">
                              {t('badge_spirit_done', { name: spiritName(s.spiritIdx) })}
                            </Badge>
                          )}
                          {/* No ultimate badge here — it belongs to the day, and
                              lives in the date cell. This column stays for the
                              milestones that really are per-step: a level
                              cleared, a spirit finished. */}
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
