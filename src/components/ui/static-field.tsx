import { cn } from '@/lib/utils'

/**
 * Read-only stand-in for an Input. Matches the h-8 inline-control height so
 * toggling edit mode does not reflow the surrounding layout.
 */
export function StaticField({
  children,
  className,
  muted,
}: {
  children: React.ReactNode
  className?: string
  muted?: boolean
}) {
  return (
    <div
      className={cn(
        'h-8 flex items-center px-3 rounded-md bg-muted/50 text-sm min-w-0 wrap-anywhere break-words',
        muted && 'text-muted-foreground',
        className
      )}
    >
      {children}
    </div>
  )
}
