import { useEffect, useRef, useState } from 'react'
import type { Rules, Spirit, Ultimate } from '@/data/seasons'
import { solve, type SolveError, type SolveResult } from '@/lib/solver'
import type { SolveRequest } from '@/lib/solver.worker'

type Outcome = SolveResult | SolveError

interface Args {
  spirits: Spirit[]
  ultimates: Ultimate[]
  rules: Rules
  targetIdx: number
}

/**
 * Solve in a worker, keeping the last good answer on screen while a new one
 * computes.
 *
 * The search is exponential in spirits: a six-spirit board whose levels hold
 * three items each takes tens of seconds. On the render path that is not a slow
 * update, it is a frozen tab — and it would re-run on every keystroke in edit
 * mode. Off-thread it costs nothing visible, and superseded requests are
 * dropped by id so a burst of typing only ever paints the newest result.
 */
export function useSolve({ spirits, ultimates, rules, targetIdx }: Args): {
  outcome: Outcome | null
  pending: boolean
} {
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [pending, setPending] = useState(true)
  const workerRef = useRef<Worker | null>(null)
  const latestId = useRef(0)

  useEffect(() => {
    // No worker (older browser, or a test runner) — fall back to solving inline.
    // Correctness never depends on the worker, only responsiveness does.
    if (typeof Worker === 'undefined') return
    const w = new Worker(new URL('../lib/solver.worker.ts', import.meta.url), { type: 'module' })
    w.onmessage = (e: MessageEvent<{ id: number; payload: Outcome }>) => {
      if (e.data.id !== latestId.current) return // superseded by a newer edit
      setOutcome(e.data.payload)
      setPending(false)
    }
    workerRef.current = w
    return () => {
      workerRef.current = null
      w.terminate()
    }
  }, [])

  useEffect(() => {
    const id = ++latestId.current
    const req: SolveRequest = { id, spirits, ultimates, rules, targetIdx }
    const w = workerRef.current
    if (!w) {
      try {
        setOutcome(solve(spirits, ultimates, rules, targetIdx))
      } catch (err) {
        setOutcome({ errorKey: 'err_solver', vars: { msg: err instanceof Error ? err.message : String(err) } })
      }
      setPending(false)
      return
    }
    setPending(true)
    w.postMessage(req)
  }, [spirits, ultimates, rules, targetIdx])

  return { outcome, pending }
}
