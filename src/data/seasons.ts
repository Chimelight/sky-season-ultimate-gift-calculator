export interface Rules {
  cpd: number
  pass: number
  heart: number
  l1f: number; l1h: number
  l2f: number; l2h: number
  l3f: number; l3h: number
  l4f: number; l4h: number
}

export interface Spirit {
  name: string
  levels: number[][]
}

export interface Ultimate {
  hearts: number
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
    id: 'season-of-carnival',
    label: '2026 Season of Carnival',
    seasonName: 'Season of Carnival',
    startDate: '2026-04-17',
    rules: { cpd:6, pass:30, heart:3, l1f:4, l1h:2, l2f:6, l2h:3, l3f:8, l3h:4, l4f:10, l4h:5 },
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
    rules: { cpd:6, pass:30, heart:3, l1f:4, l1h:2, l2f:6, l2h:3, l3f:8, l3h:4, l4f:10, l4h:5 },
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
    rules: { cpd:6, pass:30, heart:3, l1f:4, l1h:2, l2f:6, l2h:3, l3f:8, l3h:4, l4f:10, l4h:5 },
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
