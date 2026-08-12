import { SEASONS, type PlannedUltimate, type Rules, type Season, type Spirit } from '@/data/seasons'

const KEY = 'sky-calc-state'
/** Bump whenever the stored shape changes; a mismatch is discarded, not migrated. */
const VERSION = 2

export interface PersistedShape {
  seasonName: string
  startDate: string
  rules: Rules
  spirits: Spirit[]
  ultimates: PlannedUltimate[]
  targetIdx: number
  /** Which SEASONS entry this started from, so the picker can resync. */
  seasonId: string
}

const RULE_KEYS = ['cpd', 'pass', 'heart', 'l1f', 'l2f', 'l3f', 'l4f'] as const

const num = (v: unknown, fallback = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback)

/**
 * Rebuild a trusted value from whatever is in storage.
 *
 * Anything here may have been written by an older build, hand-edited, or
 * corrupted, and a malformed blob reaching `solve()` crashes the whole page —
 * so every field is re-derived rather than trusted, and a shape that cannot be
 * salvaged returns null so the caller falls back to the default season.
 */
function sanitize(raw: unknown): PersistedShape | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  if (!Array.isArray(o.spirits) || !Array.isArray(o.ultimates)) return null
  if (!o.rules || typeof o.rules !== 'object') return null

  const src = o.rules as Record<string, unknown>
  const rules = Object.fromEntries(RULE_KEYS.map(k => [k, num(src[k])])) as unknown as Rules

  const spirits: Spirit[] = o.spirits
    .filter((s): s is Record<string, unknown> => !!s && typeof s === 'object')
    .map(s => ({
      name: typeof s.name === 'string' ? s.name : '',
      levels: [0, 1, 2, 3].map(i => {
        const lv = Array.isArray(s.levels) ? s.levels[i] : undefined
        return Array.isArray(lv) ? lv.map(c => num(c)) : []
      }),
    }))
  if (spirits.length === 0) return null

  // Ids come back from storage but cannot be trusted: a duplicate or a gap
  // would make two rows claim to be the same gift, or a label point at nothing.
  // Anything not a clean unique number falls back to the array position, which
  // is what the ids meant before reordering existed.
  const seen = new Set<number>()
  const ultimates: PlannedUltimate[] = o.ultimates
    .filter((u): u is Record<string, unknown> => !!u && typeof u === 'object')
    .map((u, i) => {
      const raw = num(u.id, -1)
      const id = Number.isInteger(raw) && raw >= 0 && !seen.has(raw) ? raw : i
      seen.add(id)
      return { hearts: Math.max(0, num(u.hearts)), id }
    })
  if (ultimates.length === 0) return null

  return {
    seasonName: typeof o.seasonName === 'string' ? o.seasonName : '',
    startDate: typeof o.startDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(o.startDate)
      ? o.startDate
      : new Date().toISOString().slice(0, 10),
    rules,
    spirits,
    ultimates,
    targetIdx: Math.min(Math.max(0, Math.round(num(o.targetIdx))), ultimates.length - 1),
    seasonId: typeof o.seasonId === 'string' ? o.seasonId : (SEASONS[0]?.id ?? ''),
  }
}

/** Restore saved edits, or null when there are none worth restoring. */
export function loadPersisted(): PersistedShape | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed?.v !== VERSION) return null
    return sanitize(parsed.state)
  } catch {
    return null
  }
}

export function savePersisted(state: PersistedShape): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ v: VERSION, state }))
  } catch {
    /* private mode or quota — the app still works, it just will not remember */
  }
}

export function clearPersisted(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}

export const findSeason = (id: string): Season | undefined => SEASONS.find(s => s.id === id)
