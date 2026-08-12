import { formatFriendship } from '@/lib/schedule'

/**
 * One spirit's friendship, drawn on the spirit's own full scale rather than
 * per-level: friendship never resets, so a bar that rescaled at each level
 * would make the same +1 look different from row to row. Ticks mark the level
 * thresholds, so "how far to the next level" stays readable without a legend.
 *
 * Two segments, because the row is about a change: `had` is what the spirit
 * already carried, `bar` is what this step just added. The step's share is the
 * darker one — it is the thing the row is reporting.
 */
export function FriendshipBar({
  after,
  gain,
  total,
  marks,
}: {
  after: number
  gain: number
  total: number
  marks: readonly number[]
}) {
  if (total <= 0) return null
  const pct = (v: number) => `${Math.min(100, Math.max(0, (v / total) * 100))}%`
  const had = Math.max(0, after - gain)

  return (
    <span className="relative block h-1.5 w-full min-w-[6rem] overflow-hidden rounded-full bg-muted">
      <span className="absolute inset-y-0 left-0 bg-[var(--sp-br)]" style={{ width: pct(had) }} />
      <span className="absolute inset-y-0 bg-[var(--sp-bar)]" style={{ left: pct(had), width: pct(gain) }} />
      {/* Thresholds are cut out of the fill rather than drawn over it, so a tick
          never reads as part of the progress it is measuring. */}
      {marks.slice(0, -1).map(m => (
        <span
          key={m}
          className="absolute inset-y-0 w-px bg-background"
          style={{ left: pct(m) }}
          aria-hidden="true"
        />
      ))}
    </span>
  )
}

/** The numeric line above the bar; kept here so the two stay in step. */
export function friendshipText(after: number, total: number) {
  return `${formatFriendship(after)} / ${formatFriendship(total)}`
}
