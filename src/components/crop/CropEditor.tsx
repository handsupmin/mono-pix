import { useEffect, useRef, useState } from 'react'
import Cropper from 'react-easy-crop'
import { useCropStore } from '@/stores/crop.store'
import { useSettingsStore } from '@/stores/settings.store'
import type { Area } from 'react-easy-crop'

interface CropEditorProps {
  imageUrl: string
  showGrid: boolean
  gridColor: string
}

interface CropBoxRect {
  top: number
  left: number
  width: number
  height: number
}

export function CropEditor({ imageUrl, showGrid, gridColor }: CropEditorProps) {
  const { crop, zoom, setCrop, setZoom, setCroppedAreaPixels } = useCropStore()
  const { resolution } = useSettingsStore()
  const containerRef = useRef<HTMLDivElement>(null)
  const [cropBoxRect, setCropBoxRect] = useState<CropBoxRect | null>(null)

  const onCropComplete = (_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }

  // Track the crop area element position relative to container
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const update = () => {
      const cropEl = container.querySelector('.reactEasyCrop_CropArea') as HTMLElement | null
      if (!cropEl) return
      const containerRect = container.getBoundingClientRect()
      const cropRect = cropEl.getBoundingClientRect()
      setCropBoxRect({
        top: cropRect.top - containerRect.top,
        left: cropRect.left - containerRect.left,
        width: cropRect.width,
        height: cropRect.height,
      })
    }

    const ro = new ResizeObserver(update)
    ro.observe(container)
    // Also poll briefly after mount for initial render
    const t1 = setTimeout(update, 50)
    const t2 = setTimeout(update, 200)

    return () => {
      ro.disconnect()
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [imageUrl])

  // Update on zoom/crop changes too
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const cropEl = container.querySelector('.reactEasyCrop_CropArea') as HTMLElement | null
    if (!cropEl) return
    const containerRect = container.getBoundingClientRect()
    const cropRect = cropEl.getBoundingClientRect()
    setCropBoxRect({
      top: cropRect.top - containerRect.top,
      left: cropRect.left - containerRect.left,
      width: cropRect.width,
      height: cropRect.height,
    })
  }, [zoom, crop])

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <Cropper
        key={imageUrl}
        image={imageUrl}
        crop={crop}
        zoom={zoom}
        aspect={1}
        onCropChange={setCrop}
        onZoomChange={setZoom}
        onCropComplete={onCropComplete}
        showGrid={false}
        style={{
          containerStyle: { borderRadius: '0.75rem', overflow: 'hidden' },
          cropAreaStyle: {
            border: '2px solid rgba(255,255,255,0.8)',
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
          },
        }}
      />
      {showGrid && cropBoxRect && (
        <GridOverlay resolution={resolution} rect={cropBoxRect} color={gridColor} />
      )}
    </div>
  )
}

function GridOverlay({
  resolution,
  rect,
  color,
}: {
  resolution: number
  rect: CropBoxRect
  color: string
}) {
  const opacity = resolution >= 128 ? 0.15 : resolution >= 64 ? 0.25 : 0.4
  const lines: React.ReactNode[] = []

  for (let i = 1; i < resolution; i++) {
    const pct = (i / resolution) * 100
    lines.push(
      <line
        key={`v-${i}`}
        x1={`${pct}%`}
        y1="0"
        x2={`${pct}%`}
        y2="100%"
        stroke={color}
        strokeWidth="0.5"
        strokeOpacity={opacity}
      />,
      <line
        key={`h-${i}`}
        x1="0"
        y1={`${pct}%`}
        x2="100%"
        y2={`${pct}%`}
        stroke={color}
        strokeWidth="0.5"
        strokeOpacity={opacity}
      />,
    )
  }

  return (
    <svg
      className="absolute pointer-events-none"
      style={{
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {lines}
    </svg>
  )
}
