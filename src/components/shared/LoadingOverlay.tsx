import { useEffect, useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useConversionStore } from '@/stores/conversion.store'

const GRID = 15
const TOTAL = GRID * GRID
const CYCLE_MS = 2000

// Filled pixel color: uses CSS variables via inline check
const FILL_COLOR_LIGHT = '#9ca3af' // gray-400
const FILL_COLOR_DARK = '#d1d5db' // gray-300 (slightly muted white)

function shuffledIndices() {
  const arr = Array.from({ length: TOTAL }, (_, i) => i)
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function getFillColor() {
  if (typeof window === 'undefined') return FILL_COLOR_LIGHT
  return document.documentElement.classList.contains('dark') ? FILL_COLOR_DARK : FILL_COLOR_LIGHT
}

export function LoadingOverlay() {
  const { t } = useTranslation()
  const { status } = useConversionStore()
  const [pixels, setPixels] = useState<(string | null)[]>(() => new Array(TOTAL).fill(null))
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const phaseRef = useRef<'fill' | 'clear'>('fill')
  const orderRef = useRef<number[]>(shuffledIndices())
  const stepRef = useRef(0)

  useEffect(() => {
    if (status !== 'converting') {
      setPixels(new Array(TOTAL).fill(null))
      return
    }

    const fillColor = getFillColor()
    const interval = CYCLE_MS / TOTAL
    phaseRef.current = 'fill'
    orderRef.current = shuffledIndices()
    stepRef.current = 0
    const current = new Array<string | null>(TOTAL).fill(null)

    const tick = () => {
      const phase = phaseRef.current
      const idx = orderRef.current[stepRef.current]

      if (phase === 'fill') {
        current[idx] = fillColor
      } else {
        current[idx] = null
      }

      stepRef.current++
      setPixels([...current])

      if (stepRef.current >= TOTAL) {
        stepRef.current = 0
        orderRef.current = shuffledIndices()
        phaseRef.current = phase === 'fill' ? 'clear' : 'fill'
      }

      timerRef.current = setTimeout(tick, interval)
    }

    tick()

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [status])

  if (status !== 'converting') return null

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm rounded-xl gap-5">
      {/* Pixel grid animation */}
      <div
        className="w-32 h-32 grid overflow-hidden"
        style={{
          gridTemplateColumns: `repeat(${GRID}, 1fr)`,
          gridTemplateRows: `repeat(${GRID}, 1fr)`,
          gap: '1px',
        }}
      >
        {pixels.map((color, i) => (
          <div
            key={i}
            className="transition-colors duration-100"
            style={{
              backgroundColor: color ?? 'var(--color-muted)',
            }}
          />
        ))}
      </div>

      {/* Label */}
      <p
        className="text-sm font-medium text-foreground animate-pulse"
        style={{ fontFamily: 'DungGeunMo, monospace' }}
      >
        {t('progress.pixelating')}
      </p>
    </div>
  )
}
