import { useEffect, useRef } from 'react'
import { useConversionStore } from '@/stores/conversion.store'
import { useSettingsStore } from '@/stores/settings.store'

function PixelCanvas({ src, alt, className }: { src: string; alt: string; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const img = new Image()
    img.onload = () => {
      const { width: cw, height: ch } = container.getBoundingClientRect()
      const scale = Math.min(cw / img.width, ch / img.height)
      const dw = Math.floor(img.width * scale)
      const dh = Math.floor(img.height * scale)
      canvas.width = dw
      canvas.height = dh
      const ctx = canvas.getContext('2d')!
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(img, 0, 0, dw, dh)
    }
    img.src = src
  }, [src])

  return (
    <div
      ref={containerRef}
      className={`w-full h-full flex items-center justify-center ${className ?? ''}`}
    >
      <canvas ref={canvasRef} aria-label={alt} />
    </div>
  )
}

export function PreviewArea() {
  const { resultDataUrl, originalCroppedDataUrl } = useConversionStore()
  const { viewMode } = useSettingsStore()

  if (!resultDataUrl || !originalCroppedDataUrl) return null

  if (viewMode === 'before') {
    return (
      <div className="w-full h-full rounded-xl overflow-hidden bg-[repeating-conic-gradient(#e5e5e5_0%_25%,transparent_0%_50%)_0_0/16px_16px]">
        <PixelCanvas src={originalCroppedDataUrl} alt="Before" className="rounded-xl" />
      </div>
    )
  }

  if (viewMode === 'after') {
    return (
      <div className="w-full h-full rounded-xl overflow-hidden bg-[repeating-conic-gradient(#e5e5e5_0%_25%,transparent_0%_50%)_0_0/16px_16px]">
        <PixelCanvas src={resultDataUrl} alt="After" className="rounded-xl" />
      </div>
    )
  }

  if (viewMode === 'compare') {
    return (
      <div className="relative w-full h-full overflow-hidden rounded-xl bg-[repeating-conic-gradient(#e5e5e5_0%_25%,transparent_0%_50%)_0_0/16px_16px]">
        {/* Before (full, behind) */}
        <div className="absolute inset-0">
          <PixelCanvas src={originalCroppedDataUrl} alt="Before" />
        </div>
        {/* After (clipped to right 50%) */}
        <div className="absolute inset-0" style={{ clipPath: 'inset(0 0 0 50%)' }}>
          <PixelCanvas src={resultDataUrl} alt="After" />
        </div>
        {/* Divider */}
        <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white/80 shadow-lg -translate-x-px" />
        {/* Labels */}
        <span className="absolute top-2 left-3 text-[10px] font-medium text-white/70 bg-black/30 px-1.5 py-0.5 rounded">
          Before
        </span>
        <span className="absolute top-2 right-3 text-[10px] font-medium text-white/70 bg-black/30 px-1.5 py-0.5 rounded">
          After
        </span>
      </div>
    )
  }

  return null
}
