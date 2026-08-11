import { useEffect, useRef, useState } from 'react'
import type { PlannedUltimate, Rules, Spirit } from '@/data/seasons'
import { solve, type SolveError, type SolveResult } from '@/lib/solver'
import type { SolveRequest } from '@/lib/solver.worker'

type Outcome = SolveResult | SolveError

export interface SolveInput {
  spirits: Spirit[]
  /** In redemption order — the array order is what the solver consumes. */
  ultimates: PlannedUltimate[]
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
export function useSolve({ spirits, ultimates, rules, targetIdx }: SolveInput): {
  outcome: Outcome | null
  /** The inputs `outcome` was computed from — never today's state. */
  input: SolveInput | null
  pending: boolean
} {
  const [solved, setSolved] = useState<{ outcome: Outcome; input: SolveInput } | null>(null)
  const [pending, setPending] = useState(true)
  const workerRef = useRef<Worker | null>(null)
  const latestId = useRef(0)
  /** Inputs by request id, so a reply is paired with what produced it. */
  const inflight = useRef<Record<number, SolveInput>>({})

  useEffect(() => {
    // No worker (older browser, or a test runner) — fall back to solving inline.
    // Correctness never depends on the worker, only responsiveness does.
    if (typeof Worker === 'undefined') return
    const w = new Worker(new URL('../lib/solver.worker.ts', import.meta.url), { type: 'module' })
    w.onmessage = (e: MessageEvent<{ id: number; payload: Outcome }>) => {
      if (e.data.id !== latestId.current) return // superseded by a newer edit
      setSolved({ outcome: e.data.payload, input: inflight.current[e.data.id] })
      delete inflight.current[e.data.id]
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
    const input: SolveInput = { spirits, ultimates, rules, targetIdx }
    const w = workerRef.current
    if (!w) {
      try {
        setSolved({ outcome: solve(spirits, ultimates, rules, targetIdx), input })
      } catch (err) {
        setSolved({
          outcome: { errorKey: 'err_solver', vars: { msg: err instanceof Error ? err.message : String(err) } },
          input,
        })
      }
      setPending(false)
      return
    }
    inflight.current[id] = input
    setPending(true)
    w.postMessage({ id, ...input } satisfies SolveRequest)
  }, [spirits, ultimates, rules, targetIdx])

  return { outcome: solved?.outcome ?? null, input: solved?.input ?? null, pending }
}
