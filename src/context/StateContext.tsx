import { createContext, useContext, useReducer, type ReactNode } from 'react'
import { SEASONS, type Spirit, type Ultimate, type Rules, type Season } from '@/data/seasons'

export interface AppState {
  seasonName: string
  startDate: string
  rules: Rules
  spirits: Spirit[]
  ultimates: Ultimate[]
  targetIdx: number
}

function cloneSeason(s: Season): AppState {
  return {
    seasonName: s.seasonName,
    startDate: s.startDate,
    rules: { ...s.rules },
    spirits: s.spirits.map(sp => ({ name: sp.name, levels: sp.levels.map(l => l.slice()) })),
    ultimates: s.ultimates.map(u => ({ ...u })),
    targetIdx: s.targetIdx ?? 0,
  }
}

function defaultState(): AppState {
  return SEASONS.length > 0 ? cloneSeason(SEASONS[0]) : {
    seasonName: 'Season',
    startDate: new Date().toISOString().slice(0, 10),
    rules: { cpd: 6, pass: 30, heart: 3, l1f: 4, l1h: 2, l2f: 6, l2h: 3, l3f: 8, l3h: 4, l4f: 10, l4h: 5 },
    spirits: [{ name: 'Spirit 1', levels: [[4], [19, 7], [24, 10], [28]] }],
    ultimates: [{ hearts: 2 }],
    targetIdx: 0,
  }
}

type Action =
  | { type: 'SET_SEASON_NAME'; value: string }
  | { type: 'SET_START_DATE'; value: string }
  | { type: 'SET_RULE'; key: keyof Rules; value: number }
  | { type: 'SET_SPIRIT_NAME'; idx: number; value: string }
  | { type: 'SET_SPIRIT_COST'; spiritIdx: number; lvl: number; pos: number; value: string }
  | { type: 'ADD_SPIRIT'; defaultLevels: number[][] }
  | { type: 'REMOVE_SPIRIT'; idx: number }
  | { type: 'SET_ULTIMATE_HEARTS'; idx: number; value: number }
  | { type: 'ADD_ULTIMATE' }
  | { type: 'REMOVE_ULTIMATE'; idx: number }
  | { type: 'SET_TARGET_IDX'; idx: number }
  | { type: 'LOAD_SEASON'; season: Season }

const MAX_SPIRITS = 6

function reducer(state: AppState, action: Action): AppState {
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
        const cur = sp.levels[action.lvl] || []
        let newLvl: number[]
        if (action.pos === 0) {
          newLvl = action.value === '' ? cur.slice(1) : [+action.value || 0, ...cur.slice(1)]
        } else {
          newLvl = action.value === '' ? cur.slice(0, 1) : [(cur[0] ?? 0), +action.value || 0]
        }
        const levels = sp.levels.map((l, li) => li === action.lvl ? newLvl : l)
        return { ...sp, levels }
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

interface StateContextValue {
  state: AppState
  dispatch: React.Dispatch<Action>
  maxSpirits: number
}

const StateContext = createContext<StateContextValue | null>(null)

export function StateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, defaultState)
  return (
    <StateContext.Provider value={{ state, dispatch, maxSpirits: MAX_SPIRITS }}>
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
