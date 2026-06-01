import { useEffect, useRef, useState } from 'react'
import Cropper from 'react-easy-crop'
import { useCropStore } from '@/stores/crop.store'
import { useSettingsStore } from '@/stores/settings.store'
import { useUploadStore } from '@/stores/upload.store'
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

type ResizeHandle = 'n' | 'e' | 's' | 'w' | 'ne' | 'nw' | 'se' | 'sw'

interface ResizeDragState {
  handle: ResizeHandle
  startX: number
  startY: number
  startWidth: number
  startHeight: number
  lastCropWidth: number
  lastCropHeight: number
  lastRatioWidth: number
  lastRatioHeight: number
}

const MIN_CROP_EDGE = 96
const MAX_RATIO_PART = 99

function ratioToAspectPair(ratio: number) {
  const clampedRatio = Math.min(MAX_RATIO_PART, Math.max(1 / MAX_RATIO_PART, ratio))
  let bestWidth = 1
  let bestHeight = 1
  let bestError = Infinity

  for (let height = 1; height <= MAX_RATIO_PART; height++) {
    const width = Math.min(MAX_RATIO_PART, Math.max(1, Math.round(clampedRatio * height)))
    const error = Math.abs(width / height - clampedRatio)

    if (error < bestError) {
      bestWidth = width
      bestHeight = height
      bestError = error
    }
  }

  return { width: bestWidth, height: bestHeight }
}

function clampCropSize(
  size: { width: number; height: number },
  container: HTMLElement | null,
  mediaScale = 1,
) {
  const rect = container?.getBoundingClientRect()
  const mediaEl = container?.querySelector('.reactEasyCrop_Image, .reactEasyCrop_Video')
  const mediaRect = mediaEl?.getBoundingClientRect()
  const mediaWidth = mediaRect ? mediaRect.width * mediaScale : size.width
  const mediaHeight = mediaRect ? mediaRect.height * mediaScale : size.height
  const maxWidth = Math.min(rect?.width ?? mediaWidth, mediaWidth)
  const maxHeight = Math.min(rect?.height ?? mediaHeight, mediaHeight)
  const minWidth = Math.min(MIN_CROP_EDGE, maxWidth)
  const minHeight = Math.min(MIN_CROP_EDGE, maxHeight)

  return {
    width: Math.round(Math.min(Math.max(size.width, minWidth), maxWidth)),
    height: Math.round(Math.min(Math.max(size.height, minHeight), maxHeight)),
  }
}

function getResizedCropSize(drag: ResizeDragState, clientX: number, clientY: number) {
  const dx = clientX - drag.startX
  const dy = clientY - drag.startY
  let width = drag.startWidth
  let height = drag.startHeight

  if (drag.handle.includes('e')) width += dx * 2
  if (drag.handle.includes('w')) width -= dx * 2
  if (drag.handle.includes('s')) height += dy * 2
  if (drag.handle.includes('n')) height -= dy * 2

  return { width, height }
}

export function CropEditor({ imageUrl, showGrid, gridColor }: CropEditorProps) {
  const {
    crop,
    zoom,
    aspectRatio,
    cropSize,
    setCrop,
    setZoom,
    setCropSizeAndAspectRatio,
    setCroppedAreaPixels,
  } = useCropStore()
  const { resolution } = useSettingsStore()
  const { image } = useUploadStore()
  const cropAspect = aspectRatio.width / aspectRatio.height
  const maxZoom = image
    ? Math.max(3, Math.ceil(Math.min(image.naturalWidth, image.naturalHeight) / 8))
    : 3
  const containerRef = useRef<HTMLDivElement>(null)
  const resizeDragRef = useRef<ResizeDragState | null>(null)
  const [cropBoxRect, setCropBoxRect] = useState<CropBoxRect | null>(null)
  const [activeHandle, setActiveHandle] = useState<ResizeHandle | null>(null)

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
  }, [imageUrl, cropAspect, cropSize])

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
  }, [zoom, crop, cropAspect, cropSize])

  useEffect(() => {
    if (!cropSize) return

    const t = setTimeout(() => {
      const nextCropSize = clampCropSize(cropSize, containerRef.current)
      if (nextCropSize.width === cropSize.width && nextCropSize.height === cropSize.height) return

      const nextRatio = ratioToAspectPair(nextCropSize.width / nextCropSize.height)
      setCropSizeAndAspectRatio(nextCropSize, nextRatio.width, nextRatio.height)
    })

    return () => clearTimeout(t)
  }, [cropSize, imageUrl, setCropSizeAndAspectRatio, zoom])

  const startResize = (e: React.PointerEvent<HTMLButtonElement>, handle: ResizeHandle) => {
    if (!cropBoxRect) return
    e.preventDefault()
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    resizeDragRef.current = {
      handle,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: cropBoxRect.width,
      startHeight: cropBoxRect.height,
      lastCropWidth: cropBoxRect.width,
      lastCropHeight: cropBoxRect.height,
      lastRatioWidth: aspectRatio.width,
      lastRatioHeight: aspectRatio.height,
    }
    setActiveHandle(handle)
  }

  const handleResize = (e: React.PointerEvent<HTMLButtonElement>) => {
    const drag = resizeDragRef.current
    if (!drag) return
    e.preventDefault()
    e.stopPropagation()

    const nextCropSize = clampCropSize(
      getResizedCropSize(drag, e.clientX, e.clientY),
      containerRef.current,
    )
    const nextRatio = ratioToAspectPair(nextCropSize.width / nextCropSize.height)
    if (
      nextCropSize.width === drag.lastCropWidth &&
      nextCropSize.height === drag.lastCropHeight &&
      nextRatio.width === drag.lastRatioWidth &&
      nextRatio.height === drag.lastRatioHeight
    ) {
      return
    }

    drag.lastCropWidth = nextCropSize.width
    drag.lastCropHeight = nextCropSize.height
    drag.lastRatioWidth = nextRatio.width
    drag.lastRatioHeight = nextRatio.height
    setCropSizeAndAspectRatio(nextCropSize, nextRatio.width, nextRatio.height)
  }

  const handleZoomChange = (nextZoom: number) => {
    setZoom(nextZoom)
    if (!cropSize) return

    const nextCropSize = clampCropSize(cropSize, containerRef.current, nextZoom / zoom)
    if (nextCropSize.width === cropSize.width && nextCropSize.height === cropSize.height) return

    const nextRatio = ratioToAspectPair(nextCropSize.width / nextCropSize.height)
    setCropSizeAndAspectRatio(nextCropSize, nextRatio.width, nextRatio.height)
  }

  const stopResize = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    resizeDragRef.current = null
    setActiveHandle(null)
  }

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <Cropper
        key={imageUrl}
        image={imageUrl}
        crop={crop}
        zoom={zoom}
        maxZoom={maxZoom}
        aspect={cropAspect}
        cropSize={cropSize ?? undefined}
        onCropChange={setCrop}
        onZoomChange={handleZoomChange}
        onCropComplete={onCropComplete}
        onCropAreaChange={onCropComplete}
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
      {cropBoxRect && (
        <CropResizeHandles
          rect={cropBoxRect}
          activeHandle={activeHandle}
          onPointerDown={startResize}
          onPointerMove={handleResize}
          onPointerUp={stopResize}
        />
      )}
    </div>
  )
}

const HANDLE_CONFIG: {
  id: ResizeHandle
  label: string
  hitClassName: string
  markClassName: string
}[] = [
  {
    id: 'n',
    label: 'Resize crop area from top edge',
    hitClassName: 'left-1/2 top-0 h-5 w-12 -translate-x-1/2 -translate-y-1/2 cursor-ns-resize',
    markClassName: 'h-1 w-8',
  },
  {
    id: 'e',
    label: 'Resize crop area from right edge',
    hitClassName: 'right-0 top-1/2 h-12 w-5 -translate-y-1/2 translate-x-1/2 cursor-ew-resize',
    markClassName: 'h-8 w-1',
  },
  {
    id: 's',
    label: 'Resize crop area from bottom edge',
    hitClassName: 'bottom-0 left-1/2 h-5 w-12 -translate-x-1/2 translate-y-1/2 cursor-ns-resize',
    markClassName: 'h-1 w-8',
  },
  {
    id: 'w',
    label: 'Resize crop area from left edge',
    hitClassName: 'left-0 top-1/2 h-12 w-5 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize',
    markClassName: 'h-8 w-1',
  },
  {
    id: 'ne',
    label: 'Resize crop area from top right corner',
    hitClassName: 'right-0 top-0 h-6 w-6 -translate-y-1/2 translate-x-1/2 cursor-nesw-resize',
    markClassName: 'h-3 w-3',
  },
  {
    id: 'nw',
    label: 'Resize crop area from top left corner',
    hitClassName: 'left-0 top-0 h-6 w-6 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize',
    markClassName: 'h-3 w-3',
  },
  {
    id: 'se',
    label: 'Resize crop area from bottom right corner',
    hitClassName: 'bottom-0 right-0 h-6 w-6 translate-x-1/2 translate-y-1/2 cursor-nwse-resize',
    markClassName: 'h-3 w-3',
  },
  {
    id: 'sw',
    label: 'Resize crop area from bottom left corner',
    hitClassName: 'bottom-0 left-0 h-6 w-6 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize',
    markClassName: 'h-3 w-3',
  },
]

function CropResizeHandles({
  rect,
  activeHandle,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: {
  rect: CropBoxRect
  activeHandle: ResizeHandle | null
  onPointerDown: (e: React.PointerEvent<HTMLButtonElement>, handle: ResizeHandle) => void
  onPointerMove: (e: React.PointerEvent<HTMLButtonElement>) => void
  onPointerUp: (e: React.PointerEvent<HTMLButtonElement>) => void
}) {
  return (
    <div
      className="absolute pointer-events-none z-20"
      style={{
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      }}
    >
      {HANDLE_CONFIG.map((handle) => (
        <button
          key={handle.id}
          type="button"
          aria-label={handle.label}
          className={`absolute flex items-center justify-center pointer-events-auto touch-none ${handle.hitClassName}`}
          onPointerDown={(e) => onPointerDown(e, handle.id)}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          <span
            className={`rounded-full border border-black/30 bg-white/90 shadow-sm transition-colors ${
              activeHandle === handle.id ? 'bg-primary' : ''
            } ${handle.markClassName}`}
          />
        </button>
      ))}
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
