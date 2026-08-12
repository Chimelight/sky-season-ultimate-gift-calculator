import { useCallback, useRef, useState } from 'react'

/**
 * Pointer-driven reordering for a vertical list.
 *
 * Pointer events rather than HTML5 drag-and-drop: the latter has no usable
 * touch story, and this list is dragged on phones as much as anywhere.
 *
 * The dragged row follows the pointer while the rows between its old and new
 * slot slide one place to make room, so the gap always shows where it will
 * land. Nothing is committed until the pointer is released — `onDrop` fires
 * once, with the final slot.
 *
 * Only the handle starts a drag. Making the whole row draggable would fight
 * the controls that live on it.
 */
export interface DragOrder {
  /** Spread onto each handle. */
  handleProps: (index: number) => {
    onPointerDown: (e: React.PointerEvent) => void
    onKeyDown: (e: React.KeyboardEvent) => void
    style: React.CSSProperties
  }
  /** Spread onto each row. */
  rowProps: (index: number) => { style: React.CSSProperties; 'data-dragging'?: string }
  /** Index being dragged, or null. */
  dragging: number | null
  /** Slot it would land in, or null. */
  landing: number | null
}

export function useDragOrder(count: number, onDrop: (from: number, to: number) => void): DragOrder {
  const [drag, setDrag] = useState<{ from: number; to: number; dy: number } | null>(null)
  const geom = useRef({ step: 0 })
  // The commit has to read the latest slot without going through the state
  // updater: an updater is pure and StrictMode calls it twice, so dispatching
  // from inside it fired the move twice and the two cancelled out.
  const latest = useRef<{ from: number; to: number } | null>(null)

  const finish = useCallback((commit: boolean) => {
    const d = latest.current
    latest.current = null
    setDrag(null)
    if (d && commit && d.to !== d.from) onDrop(d.from, d.to)
  }, [onDrop])

  const onPointerDown = useCallback((from: number) => (e: React.PointerEvent) => {
    if (e.button !== 0) return
    const handle = e.currentTarget as HTMLElement
    const row = handle.closest('[data-row]') as HTMLElement | null
    const list = row?.parentElement
    if (!row || !list) return

    // Measure the pitch from two real rows; rows can differ in height once a
    // long translated label wraps, and assuming a constant would drift.
    const rows = [...list.querySelectorAll<HTMLElement>('[data-row]')]
    geom.current.step = rows.length > 1
      ? rows[1].getBoundingClientRect().top - rows[0].getBoundingClientRect().top
      : row.getBoundingClientRect().height
    const y0 = e.clientY
    latest.current = { from, to: from }
    setDrag({ from, to: from, dy: 0 })
    handle.setPointerCapture(e.pointerId)

    const move = (ev: PointerEvent) => {
      const dy = ev.clientY - y0
      const step = geom.current.step || 1
      const to = Math.max(0, Math.min(count - 1, from + Math.round(dy / step)))
      latest.current = { from, to }
      setDrag({ from, to, dy })
    }
    const up = () => {
      handle.removeEventListener('pointermove', move)
      handle.removeEventListener('pointerup', up)
      handle.removeEventListener('pointercancel', cancel)
      finish(true)
    }
    const cancel = () => {
      handle.removeEventListener('pointermove', move)
      handle.removeEventListener('pointerup', up)
      handle.removeEventListener('pointercancel', cancel)
      finish(false)
    }
    handle.addEventListener('pointermove', move)
    handle.addEventListener('pointerup', up)
    handle.addEventListener('pointercancel', cancel)
    e.preventDefault()
  }, [count, finish])

  // Dragging alone would lock out anyone not using a pointer, on a row that is
  // otherwise fully keyboard-operable.
  const onKeyDown = useCallback((index: number) => (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
    e.preventDefault()
    const to = index + (e.key === 'ArrowUp' ? -1 : 1)
    if (to < 0 || to >= count) return
    onDrop(index, to)
    // Keep the moved row under the cursor's focus so a second press continues.
    requestAnimationFrame(() => {
      const list = (e.target as HTMLElement).closest('[data-list]')
      list?.querySelectorAll<HTMLElement>('[data-handle]')[to]?.focus()
    })
  }, [count, onDrop])

  const handleProps = useCallback((index: number) => ({
    onPointerDown: onPointerDown(index),
    onKeyDown: onKeyDown(index),
    style: { touchAction: 'none' as const, cursor: drag ? 'grabbing' : 'grab' },
  }), [onPointerDown, onKeyDown, drag])

  const rowProps = useCallback((index: number) => {
    if (!drag) return { style: {} }
    const { from, to, dy } = drag
    if (index === from) {
      return {
        style: { transform: `translateY(${dy}px)`, zIndex: 3, position: 'relative' as const },
        'data-dragging': 'true',
      }
    }
    const step = geom.current.step
    const shift = from < to && index > from && index <= to ? -step
      : from > to && index < from && index >= to ? step : 0
    return { style: { transform: `translateY(${shift}px)`, transition: 'transform .16s cubic-bezier(.2,.7,.3,1)' } }
  }, [drag])

  return { handleProps, rowProps, dragging: drag?.from ?? null, landing: drag?.to ?? null }
}
