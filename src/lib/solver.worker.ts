import { solve } from './solver'
import type { Rules, Spirit, Ultimate } from '@/data/seasons'

export interface SolveRequest {
  id: number
  spirits: Spirit[]
  ultimates: Ultimate[]
  rules: Rules
  targetIdx: number
}

self.onmessage = (e: MessageEvent<SolveRequest>) => {
  const { id, spirits, ultimates, rules, targetIdx } = e.data
  try {
    self.postMessage({ id, payload: solve(spirits, ultimates, rules, targetIdx) })
  } catch (err) {
    self.postMessage({
      id,
      payload: { errorKey: 'err_solver', vars: { msg: err instanceof Error ? err.message : String(err) } },
    })
  }
}
