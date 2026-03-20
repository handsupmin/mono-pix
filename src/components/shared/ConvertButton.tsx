import { useConvert } from '@/hooks/useConvert'
import { useValidResolutions } from '@/hooks/useValidResolutions'
import { cn } from '@/lib/utils'
import { useConversionStore } from '@/stores/conversion.store'
import { useCropStore } from '@/stores/crop.store'
import { useSettingsStore } from '@/stores/settings.store'
import { useUploadStore } from '@/stores/upload.store'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

const COLS = 12
const ROWS = 5
const TOTAL = COLS * ROWS
const DURATION = 300

function shuffled(len: number) {
  const arr = Array.from({ length: len }, (_, i) => i)
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function ConvertButton() {
  const { t } = useTranslation()
  const { status } = useConversionStore()
  const { image } = useUploadStore()
  const { croppedAreaPixels } = useCropStore()
  const { resolution, pixelateMode } = useSettingsStore()
  const validResolutions = useValidResolutions()
  const { convert } = useConvert()

  const isConverting = status === 'converting'
  const isDisabled =
    isConverting ||
    !image ||
    !croppedAreaPixels ||
    (pixelateMode !== 'snap' && !validResolutions.has(resolution))

  const overlayRef = useRef<HTMLSpanElement>(null)
  const rafRef = useRef<number>(0)
  const [hovered, setHovered] = useState(false)
  const [dissolved, setDissolved] = useState(false)

  const cancelAnim = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
  }, [])

  useEffect(() => {
    const overlay = overlayRef.current

    if (!hovered) {
      cancelAnim()
      setDissolved(false)
      if (overlay) {
        overlay.style.maskImage = ''
        overlay.style.webkitMaskImage = ''
      }
      return
    }

    if (!overlay) return

    const rect = overlay.getBoundingClientRect()
    const w = Math.ceil(rect.width)
    const h = Math.ceil(rect.height)
    const cellW = w / COLS
    const cellH = h / ROWS

    const maskCanvas = document.createElement('canvas')
    maskCanvas.width = w
    maskCanvas.height = h
    const ctx = maskCanvas.getContext('2d')!
    ctx.fillStyle = 'white'
    ctx.fillRect(0, 0, w, h)

    const order = shuffled(TOTAL)
    let lastStep = 0
    const startTime = performance.now()

    const applyMask = () => {
      const url = maskCanvas.toDataURL()
      overlay.style.maskImage = `url(${url})`
      overlay.style.webkitMaskImage = `url(${url})`
      overlay.style.maskSize = '100% 100%'
      overlay.style.webkitMaskSize = '100% 100%'
    }

    applyMask()

    const tick = (now: number) => {
      const progress = Math.min(1, (now - startTime) / DURATION)
      const targetStep = Math.floor(progress * TOTAL)

      // Clear all blocks from lastStep to targetStep in one batch
      for (let s = lastStep; s < targetStep; s++) {
        const idx = order[s]
        const col = idx % COLS
        const row = Math.floor(idx / COLS)
        ctx.clearRect(
          Math.floor(col * cellW),
          Math.floor(row * cellH),
          Math.ceil(cellW) + 1,
          Math.ceil(cellH) + 1,
        )
      }

      if (targetStep > lastStep) {
        lastStep = targetStep
        applyMask()
      }

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        setDissolved(true)
      }
    }

    rafRef.current = requestAnimationFrame(tick)

    return cancelAnim
  }, [hovered, cancelAnim])

  return (
    <button
      onClick={() => void convert()}
      disabled={isDisabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        'relative w-full py-3 px-6 font-semibold text-sm',
        'bg-primary text-primary-foreground rounded-lg',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
      )}
    >
      {/* Wrapper: both texts stacked, only text area gets the effect */}
      <span className="relative inline-block">
        {/* Base: DungGeunMo (revealed as overlay dissolves) */}
        <span
          className="font-semibold tracking-wide text-[0.9375rem]"
          style={{ fontFamily: 'DungGeunMo, monospace' }}
        >
          {t('controls.convert')}
        </span>

        {/* Overlay: Pretendard (dissolves pixel-by-pixel on hover) */}
        {!dissolved && (
          <span
            ref={overlayRef}
            className="absolute inset-0 flex items-center justify-center bg-primary font-semibold tracking-wide text-primary-foreground pointer-events-none"
          >
            {t('controls.convert')}
          </span>
        )}
      </span>
    </button>
  )
}
