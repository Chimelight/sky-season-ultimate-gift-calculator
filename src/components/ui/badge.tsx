import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center justify-center max-w-full whitespace-normal text-center rounded-md border px-2 py-0.5 text-xs font-medium transition-colors wrap-anywhere',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        destructive: 'border-transparent bg-destructive text-destructive-foreground',
        outline: 'text-foreground',
        // Buy and skip no longer own a hue — hue now means *which spirit*, so
        // the buy/skip axis moved onto fill: solid is owned, outline is given
        // up. Both read the ambient --sp-* set, so a badge takes its colour
        // from whichever .spirit-N wrapper it sits inside.
        buy: 'border-[var(--sp-br)] bg-[var(--sp-bg)] text-[var(--sp-fg)]',
        skip: 'border-[var(--sp-br)] bg-transparent text-[var(--sp-fg)]',
        // The spirit's number, worn wherever it needs to be identified at a
        // glance. Stronger than a badge because it is the anchor, not an event.
        identity: 'border-transparent bg-[var(--sp-br)] text-[var(--sp-fg)] font-semibold tabular-nums px-1.5',
        // The one saturated fill in the app. See --ult-fill in index.css.
        ult: 'border-transparent bg-[var(--ult-fill)] text-[var(--ult-on)] font-bold',
        order: 'border-transparent bg-primary/10 text-primary font-semibold',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

/**
 * Filled or hollow, alongside the badge's fill, so buy vs skip never rests on
 * colour alone — the same distinction has to survive a greyscale print and a
 * colour-blind reader.
 */
export function Dot({ filled }: { filled: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block size-1.5 shrink-0 rounded-full ${
        filled ? 'bg-[var(--sp-fg)]' : 'border border-[var(--sp-fg)]'
      }`}
    />
  )
}

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
