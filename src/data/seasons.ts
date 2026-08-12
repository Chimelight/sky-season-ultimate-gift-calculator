export interface Rules {
  cpd: number
  pass: number
  heart: number
  /**
   * Friendship each level is worth. A level splits this evenly across its
   * items; invites make up whatever the items don't cover, at 1 per day. So
   * these double as the days needed to skip a level outright.
   */
  l1f: number
  l2f: number
  l3f: number
  l4f: number
}

export interface Spirit {
  name: string
  levels: number[][]
}

export interface Ultimate {
  hearts: number
}

/**
 * An ultimate once it is part of a plan. The array's *order* is the order the
 * player intends to redeem in — which is what the solver has always consumed,
 * since cumHearts is a prefix sum over it — so reordering is the whole feature.
 * `id` is the ultimate's position in the season, kept so that a row still reads
 * "3rd Ultimate" after it has been dragged to the top. Without it the labels
 * would silently renumber and the plan would describe a different gift.
 */
export interface PlannedUltimate extends Ultimate {
  id: number
}

export interface Season {
  id: string
  label: string
  seasonName: string
  startDate: string
  rules: Rules
  spirits: Spirit[]
  ultimates: Ultimate[]
  targetIdx: number
}

export const SEASONS: Season[] = [
  {
    id: 'season-of-dear-van-gogh',
    label: '2026 Dear Van Gogh',
    seasonName: 'Dear Van Gogh',
    startDate: '2026-07-17',
    rules: { cpd:6, pass:30, heart:3, l1f:4, l2f:6, l3f:8, l4f:10 },
    spirits: [
      { name: 'Dutch Memory',    levels: [[4],  [18, 6], [22, 10],     [26]] },
      { name: 'Rustic Memory',   levels: [[4],  [18, 8], [22, 8],      [26]] },
      { name: 'Artistic Memory', levels: [[12], [18, 6], [22, 22, 10], [10]] },
      { name: 'Joyful Memory',   levels: [[12], [6],     [22, 22, 8],  [26, 12]] },
    ],
    ultimates: [{ hearts: 1 }, { hearts: 2 }, { hearts: 1 }],
    targetIdx: 2,
  },
  {
    id: 'season-of-carnival',
    label: '2026 Season of Carnival',
    seasonName: 'Season of Carnival',
    startDate: '2026-04-17',
    rules: { cpd:6, pass:30, heart:3, l1f:4, l2f:6, l3f:8, l4f:10 },
    spirits: [
      { name: 'Juggler',         levels: [[4], [19, 7], [24, 10], [28]] },
      { name: 'Athletic Dancer', levels: [[4], [19, 7], [24, 12], [28]] },
      { name: 'Puzzle Director', levels: [[4], [19, 7], [24, 10], [28]] },
      { name: 'Stunt Actor',     levels: [[4], [19, 7], [24, 10], [28]] },
    ],
    ultimates: [{ hearts: 2 }, { hearts: 2 }],
    targetIdx: 0,
  },
  {
    id: 'season-of-lightmending',
    label: '2026 Season of Lightmending',
    seasonName: 'Season of Lightmending',
    startDate: '2026-01-16',
    rules: { cpd:6, pass:30, heart:3, l1f:4, l2f:6, l3f:8, l4f:10 },
    spirits: [
      { name: 'Pioneer',       levels: [[4], [6],      [28, 30], [15]] },
      { name: 'Champion',      levels: [[4], [25, 6],  [28, 9],  [15]] },
      { name: 'Light Catcher', levels: [[19], [6],     [28, 11], [38]] },
      { name: 'Light Scholar', levels: [[4], [25],     [28, 30], [12]] },
    ],
    ultimates: [{ hearts: 1 }, { hearts: 1 }, { hearts: 2 }],
    targetIdx: 2,
  },
  {
    id: 'season-of-migration',
    label: '2025 Season of Migration',
    seasonName: 'Season of Migration',
    startDate: '2025-10-20',
    rules: { cpd:6, pass:30, heart:3, l1f:4, l2f:6, l3f:8, l4f:10 },
    spirits: [
      { name: 'Bird Whisperer',     levels: [[2], [4],      [24, 30], [12]] },
      { name: 'Butterfly Charmer',  levels: [[2], [6],      [24, 30], [8]] },
      { name: 'Bellmaker',          levels: [[17], [23, 4], [9, 6],   [36]] },
      { name: 'Manta Whisperer',    levels: [[2], [23, 4],  [24, 6],  [12]] },
      { name: 'Jelly Whisperer',    levels: [[2], [4],      [24, 9],  [36]] },
    ],
    ultimates: [{ hearts: 1 }, { hearts: 2 }, { hearts: 2 }],
    targetIdx: 2,
  },
]
