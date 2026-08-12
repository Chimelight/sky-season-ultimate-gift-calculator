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
        // the axis moved onto weight. Both fills are solid: the difference is
        // lightness, which survives greyscale on its own and needs no glyph.
        // All three read the ambient --sp-* set, so a badge takes its colour
        // from whichever .spirit-N wrapper it sits inside.
        //
        // buy   — the denser block: the spirit now owns the item, and purchases
        //         are the events worth finding when scanning a long plan. One
        //         step denser than soft, not a reversed block — a saturated
        //         block sitting in a pale row reads as heavy and dirty.
        // soft  — quiet block for the many invite rows; a table of dense blocks
        //         would be unreadable.
        // skip  — soft, plus a dashed edge for the item that was given up.
        buy: 'border-transparent bg-[var(--sp-solid)] text-[var(--sp-on)] font-semibold',
        soft: 'border-[var(--sp-br)] bg-[var(--sp-bg)] text-[var(--sp-fg)]',
        skip: 'border-dashed border-[var(--sp-fg)] bg-[var(--sp-bg)] text-[var(--sp-fg)]',
        // The spirit's number: an anchor, not an event. It separates from the
        // event badges by *size* — smaller type, tighter box, tighter radius —
        // rather than by going darker, which only made it shout. Paired with
        // the rule down the left edge of the cell it sits in, that is plenty.
        identity:
          'border-transparent bg-[var(--sp-br)] text-[var(--sp-fg)] font-semibold tabular-nums px-1 py-0 text-[0.68rem] leading-[1.35] rounded-[0.3rem]',
        // A spirit finishing is a milestone, not a purchase — it used to share
        // the buy style, which was survivable only while buy was a hue of its
        // own. Same ground as soft, but a full-strength edge and heavier text:
        // filled, so it does not read as hollow, yet unmistakably not a buy
        // (no edge, denser ground) nor an invite (hairline edge, normal weight).
        milestone: 'border-[var(--sp-fg)] bg-[var(--sp-bg)] text-[var(--sp-fg)] font-semibold',
        // The one saturated fill in the app. See --ult-fill in index.css.
        ult: 'border-transparent bg-[var(--ult-fill)] text-[var(--ult-on)] font-bold',
        order: 'border-transparent bg-primary/10 text-primary font-semibold',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)


export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
