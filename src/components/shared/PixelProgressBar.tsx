import { cn } from '@/lib/utils'

interface PixelProgressBarProps {
  progress: number // 0 to 1
  className?: string
}

/**
 * Progress bar that starts as a smooth bar and becomes pixelated as it fills.
 * Uses a stepped gradient to simulate pixel blocks.
 */
export function PixelProgressBar({ progress, className }: PixelProgressBarProps) {
  const pct = Math.max(0, Math.min(1, progress))
  const PIXEL_STEPS = 20

  const filledSteps = Math.round(pct * PIXEL_STEPS)

  // Low progress = smooth, high progress = pixelated blocks
  const pixelation = pct // 0 = smooth, 1 = fully pixelated
  const borderRadius = `${(1 - pixelation) * 9999}px`

  return (
    <div className={cn('relative w-full h-3 bg-muted rounded-full overflow-hidden', className)}>
      {/* Pixel blocks */}
      <div className="absolute inset-0 flex">
        {Array.from({ length: PIXEL_STEPS }).map((_, i) => {
          const isFilled = i < filledSteps
          const isEdge = i === filledSteps - 1
          const blockRadius = isEdge
            ? `0 ${borderRadius} ${borderRadius} 0`
            : i === 0
              ? `${borderRadius} 0 0 ${borderRadius}`
              : '0'

          return (
            <div
              key={i}
              className="h-full flex-1 transition-all duration-150"
              style={{
                backgroundColor: isFilled ? 'var(--color-primary)' : 'transparent',
                borderRadius: isFilled ? blockRadius : '0',
                marginRight: pixelation > 0.3 && isFilled && i < filledSteps - 1 ? '1px' : '0',
              }}
            />
          )
        })}
      </div>
    </div>
  )
}
