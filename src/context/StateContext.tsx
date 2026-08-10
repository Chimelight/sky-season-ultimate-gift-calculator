import { createContext, useContext, useEffect, useReducer, useState, type ReactNode } from 'react'
import { SEASONS, type Spirit, type Ultimate, type Rules, type Season } from '@/data/seasons'
import { clearPersisted, findSeason, loadPersisted, savePersisted } from '@/lib/persist'

export interface AppState {
  seasonName: string
  startDate: string
  rules: Rules
  spirits: Spirit[]
  ultimates: Ultimate[]
  targetIdx: number
  /** The SEASONS entry this was loaded from, so the picker can resync. */
  seasonId: string
  /**
   * Whether anything has been edited since the last season load. Only edited
   * state is persisted: otherwise a returning visitor would stay pinned to a
   * stale season long after a newer one shipped.
   */
  dirty: boolean
}

function cloneSeason(s: Season): AppState {
  return {
    seasonName: s.seasonName,
    startDate: s.startDate,
    rules: { ...s.rules },
    spirits: s.spirits.map(sp => ({ name: sp.name, levels: sp.levels.map(l => l.slice()) })),
    ultimates: s.ultimates.map(u => ({ ...u })),
    targetIdx: s.targetIdx ?? 0,
    seasonId: s.id,
    dirty: false,
  }
}

function pristineState(): AppState {
  return SEASONS.length > 0 ? cloneSeason(SEASONS[0]) : {
    seasonName: 'Season',
    startDate: new Date().toISOString().slice(0, 10),
    rules: { cpd: 6, pass: 30, heart: 3, l1f: 4, l2f: 6, l3f: 8, l4f: 10 },
    spirits: [{ name: 'Spirit 1', levels: [[4], [19, 7], [24, 10], [28]] }],
    ultimates: [{ hearts: 2 }],
    targetIdx: 0,
    seasonId: '',
    dirty: false,
  }
}

function defaultState(): AppState {
  const saved = loadPersisted()
  if (!saved) return pristineState()
  // Saved edits win over the newest season, but only the fields that were
  // actually edited — the season identity is kept so the picker agrees.
  const base = findSeason(saved.seasonId)
  return {
    ...saved,
    seasonId: base?.id ?? saved.seasonId,
    dirty: true,
  }
}

type Action =
  | { type: 'SET_SEASON_NAME'; value: string }
  | { type: 'SET_START_DATE'; value: string }
  | { type: 'SET_RULE'; key: keyof Rules; value: number }
  | { type: 'SET_SPIRIT_NAME'; idx: number; value: string }
  | { type: 'SET_SPIRIT_COST'; spiritIdx: number; lvl: number; pos: number; value: string }
  | { type: 'ADD_SPIRIT_ITEM'; spiritIdx: number; lvl: number }
  | { type: 'REMOVE_SPIRIT_ITEM'; spiritIdx: number; lvl: number }
  | { type: 'ADD_SPIRIT'; defaultLevels: number[][] }
  | { type: 'REMOVE_SPIRIT'; idx: number }
  | { type: 'SET_ULTIMATE_HEARTS'; idx: number; value: number }
  | { type: 'ADD_ULTIMATE' }
  | { type: 'REMOVE_ULTIMATE'; idx: number }
  | { type: 'SET_TARGET_IDX'; idx: number }
  | { type: 'LOAD_SEASON'; season: Season }

const MAX_SPIRITS = 6
const MAX_ITEMS_PER_LEVEL = 4

function applyAction(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_SEASON_NAME': return { ...state, seasonName: action.value }
    case 'SET_START_DATE': return { ...state, startDate: action.value || state.startDate }
    case 'SET_RULE': return { ...state, rules: { ...state.rules, [action.key]: action.value } }
    case 'SET_SPIRIT_NAME': {
      const spirits = state.spirits.map((sp, i) => i === action.idx ? { ...sp, name: action.value } : sp)
      return { ...state, spirits }
    }
    case 'SET_SPIRIT_COST': {
      const spirits = state.spirits.map((sp, i) => {
        if (i !== action.spiritIdx) return sp
        // Array length is the slot count, managed explicitly via
        // ADD/REMOVE_SPIRIT_ITEM. A 0 here just means the slot is blank; the
        // solver filters those out before dividing friendship by item count.
        const newLvl = (sp.levels[action.lvl] || []).slice()
        while (newLvl.length <= action.pos) newLvl.push(0)
        newLvl[action.pos] = action.value === '' ? 0 : +action.value || 0
        const levels = sp.levels.map((l, li) => li === action.lvl ? newLvl : l)
        return { ...sp, levels }
      })
      return { ...state, spirits }
    }
    case 'ADD_SPIRIT_ITEM':
    case 'REMOVE_SPIRIT_ITEM': {
      const spirits = state.spirits.map((sp, i) => {
        if (i !== action.spiritIdx) return sp
        const cur = sp.levels[action.lvl] || []
        if (action.type === 'ADD_SPIRIT_ITEM' && cur.length >= MAX_ITEMS_PER_LEVEL) return sp
        if (action.type === 'REMOVE_SPIRIT_ITEM' && cur.length <= 1) return sp
        // A new slot starts at 0 so it reads as empty and stays out of the
        // item count the solver divides friendship by until it is filled in.
        const next = action.type === 'ADD_SPIRIT_ITEM' ? [...cur, 0] : cur.slice(0, -1)
        return { ...sp, levels: sp.levels.map((l, li) => li === action.lvl ? next : l) }
      })
      return { ...state, spirits }
    }
    case 'ADD_SPIRIT': {
      if (state.spirits.length >= MAX_SPIRITS) return state
      return {
        ...state,
        spirits: [...state.spirits, {
          name: `Spirit ${state.spirits.length + 1}`,
          levels: action.defaultLevels,
        }],
      }
    }
    case 'REMOVE_SPIRIT': {
      if (state.spirits.length <= 1) return state
      return { ...state, spirits: state.spirits.filter((_, i) => i !== action.idx) }
    }
    case 'SET_ULTIMATE_HEARTS': {
      const ultimates = state.ultimates.map((u, i) => i === action.idx ? { hearts: Math.max(0, action.value) } : u)
      return { ...state, ultimates }
    }
    case 'ADD_ULTIMATE':
      return { ...state, ultimates: [...state.ultimates, { hearts: 1 }] }
    case 'REMOVE_ULTIMATE': {
      if (state.ultimates.length <= 1) return state
      const ultimates = state.ultimates.filter((_, i) => i !== action.idx)
      const targetIdx = Math.min(state.targetIdx, ultimates.length - 1)
      return { ...state, ultimates, targetIdx }
    }
    case 'SET_TARGET_IDX':
      return { ...state, targetIdx: action.idx }
    case 'LOAD_SEASON':
      return cloneSeason(action.season)
    default:
      return state
  }
}

// Every action except loading a season marks the state edited. Doing it here
// rather than in each case means a new action cannot forget to.
function reducer(state: AppState, action: Action): AppState {
  const next = applyAction(state, action)
  if (next === state || action.type === 'LOAD_SEASON') return next
  return next.dirty ? next : { ...next, dirty: true }
}

interface StateContextValue {
  state: AppState
  dispatch: React.Dispatch<Action>
  maxSpirits: number
  maxItemsPerLevel: number
  /** Season data is presented read-only until the user opts into editing. */
  editing: boolean
  setEditing: (v: boolean) => void
}

const StateContext = createContext<StateContextValue | null>(null)

export function StateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, defaultState)
  const [editing, setEditing] = useState(false)

  // Persist edits so a refresh does not discard them, and drop the record the
  // moment a season is loaded — an unedited visitor should always land on the
  // newest season rather than a stale copy of an old one.
  useEffect(() => {
    if (!state.dirty) {
      clearPersisted()
      return
    }
    const { seasonName, startDate, rules, spirits, ultimates, targetIdx, seasonId } = state
    savePersisted({ seasonName, startDate, rules, spirits, ultimates, targetIdx, seasonId })
  }, [state])

  return (
    <StateContext.Provider
      value={{ state, dispatch, maxSpirits: MAX_SPIRITS, maxItemsPerLevel: MAX_ITEMS_PER_LEVEL, editing, setEditing }}
    >
      {children}
    </StateContext.Provider>
  )
}

export function useAppState() {
  const ctx = useContext(StateContext)
  if (!ctx) throw new Error('useAppState must be used within StateProvider')
  return ctx
}

export { cloneSeason }
