/**
 * Every spirit carries one identity colour, used wherever that spirit appears:
 * the row it owns in the daily breakdown, its badges, its progress bar, its
 * column in the tree map. Reading the plan is mostly a matter of tracking which
 * spirit an event belongs to, and a colour does that faster than re-reading the
 * name on every row.
 *
 * The ramps live in `src/index.css` as `--s1-*` … `--s6-*`; this only maps an
 * index onto the class that binds one of them to the generic `--sp-*` names.
 * Six ramps cover MAX_SPIRITS; the modulo is a guard, not a feature — a season
 * with more spirits would start reusing colours and should get more ramps.
 */
export const SPIRIT_RAMPS = 6

export function spiritClass(idx: number | null | undefined): string {
  if (idx === null || idx === undefined || idx < 0) return ''
  return `spirit-${(idx % SPIRIT_RAMPS) + 1}`
}
