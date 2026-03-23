import { useConversionStore } from '@/stores/conversion.store'
import { useSettingsStore } from '@/stores/settings.store'
import { useCallback, useEffect, useRef, useState } from 'react'

const MIN_ZOOM = 1
const MAX_ZOOM = 20
const ZOOM_SENSITIVITY = 0.002

function ZoomablePixelCanvas({
  src,
  alt,
  className,
  numCells,
  onCanvasSize,
  children,
}: {
  src: string
  alt: string
  className?: string
  numCells?: number | null
  onCanvasSize?: (w: number, h: number) => void
  children?: React.ReactNode
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const dragRef = useRef<{ startX: number; startY: number; panX: number; panY: number } | null>(
    null,
  )

  // Draw image
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const img = new Image()
    img.onload = () => {
      const { width: cw, height: ch } = container.getBoundingClientRect()
      const scale = Math.min(cw / img.width, ch / img.height)
      let dw = Math.floor(img.width * scale)
      let dh = Math.floor(img.height * scale)
      if (numCells && numCells > 0) {
        const cellPx = Math.max(1, Math.floor(Math.min(dw, dh) / numCells))
        dw = cellPx * numCells
        dh = cellPx * numCells
      }
      canvas.width = dw
      canvas.height = dh
      const ctx = canvas.getContext('2d')!
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(img, 0, 0, dw, dh)
      onCanvasSize?.(dw, dh)
    }
    img.src = src
  }, [src, numCells, onCanvasSize])

  // Reset zoom/pan when src changes (cleanup runs before next effect)
  useEffect(() => {
    return () => {
      setZoom(1)
      setPan({ x: 0, y: 0 })
    }
  }, [src])

  // Wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = -e.deltaY * ZOOM_SENSITIVITY
    setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z * (1 + delta))))
  }, [])

  // Drag pan
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (zoom <= 1) return
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
      dragRef.current = { startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y }
    },
    [zoom, pan],
  )

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return
    setPan({
      x: dragRef.current.panX + (e.clientX - dragRef.current.startX),
      y: dragRef.current.panY + (e.clientY - dragRef.current.startY),
    })
  }, [])

  const handlePointerUp = useCallback(() => {
    dragRef.current = null
  }, [])

  // Double-click reset
  const handleDoubleClick = useCallback(() => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }, [])

  return (
    <div
      ref={containerRef}
      className={`w-full h-full flex items-center justify-center overflow-hidden ${className ?? ''}`}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onDoubleClick={handleDoubleClick}
      style={{ cursor: zoom > 1 ? 'grab' : 'default' }}
    >
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
          position: 'relative',
          display: 'inline-block',
        }}
      >
        <canvas ref={canvasRef} aria-label={alt} style={{ imageRendering: 'pixelated' }} />
        {children}
      </div>
    </div>
  )
}

function PixelCanvas({
  src,
  alt,
  className,
  numCells,
  onCanvasSize,
}: {
  src: string
  alt: string
  className?: string
  numCells?: number | null
  onCanvasSize?: (w: number, h: number) => void
}) {
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
      let dw = Math.floor(img.width * scale)
      let dh = Math.floor(img.height * scale)
      // Snap display size to multiple of numCells so every cell gets equal screen pixels
      if (numCells && numCells > 0) {
        const cellPx = Math.max(1, Math.floor(Math.min(dw, dh) / numCells))
        dw = cellPx * numCells
        dh = cellPx * numCells
      }
      canvas.width = dw
      canvas.height = dh
      const ctx = canvas.getContext('2d')!
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(img, 0, 0, dw, dh)
      onCanvasSize?.(dw, dh)
    }
    img.src = src
  }, [src, numCells, onCanvasSize])

  return (
    <div
      ref={containerRef}
      className={`w-full h-full flex items-center justify-center ${className ?? ''}`}
    >
      <canvas ref={canvasRef} aria-label={alt} />
    </div>
  )
}

function SnapGridOverlay({
  width,
  height,
  colCuts,
  rowCuts,
  color,
  centered = false,
}: {
  width: number
  height: number
  colCuts: number[]
  rowCuts: number[]
  color: string
  centered?: boolean
}) {
  if (width <= 0 || height <= 0) return null

  // colCuts/rowCuts are in original image coordinates.
  // Scale to display coordinates.
  const imgW = colCuts[colCuts.length - 1] || 1
  const imgH = rowCuts[rowCuts.length - 1] || 1
  const scaleX = width / imgW
  const scaleY = height / imgH

  const lines: React.ReactNode[] = []

  for (let i = 1; i < colCuts.length - 1; i++) {
    const x = Math.round(colCuts[i] * scaleX)
    lines.push(
      <line
        key={`v${i}`}
        x1={x}
        y1={0}
        x2={x}
        y2={height}
        stroke={color}
        strokeWidth={1}
        strokeOpacity={0.5}
      />,
    )
  }
  for (let i = 1; i < rowCuts.length - 1; i++) {
    const y = Math.round(rowCuts[i] * scaleY)
    lines.push(
      <line
        key={`h${i}`}
        x1={0}
        y1={y}
        x2={width}
        y2={y}
        stroke={color}
        strokeWidth={1}
        strokeOpacity={0.5}
      />,
    )
  }

  return (
    <svg
      className="absolute pointer-events-none"
      width={width}
      height={height}
      style={
        centered
          ? { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
          : { top: 0, left: 0 }
      }
    >
      {lines}
    </svg>
  )
}

function CompareView({ beforeSrc, afterSrc }: { beforeSrc: string; afterSrc: string }) {
  const [splitPct, setSplitPct] = useState(50)
  const containerRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)

  const updateSplit = (clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const pct = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100))
    setSplitPct(pct)
  }

  const onPointerDown = (e: React.PointerEvent) => {
    isDragging.current = true
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    e.preventDefault()
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return
    updateSplit(e.clientX)
  }

  const onPointerUp = () => {
    isDragging.current = false
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden rounded-xl bg-[repeating-conic-gradient(var(--checkerboard)_0%_25%,transparent_0%_50%)_0_0/16px_16px]"
    >
      {/* Before (full, behind) */}
      <div className="absolute inset-0">
        <PixelCanvas src={beforeSrc} alt="Before" />
      </div>
      {/* After (clipped to right of split) */}
      <div className="absolute inset-0" style={{ clipPath: `inset(0 0 0 ${splitPct}%)` }}>
        <PixelCanvas src={afterSrc} alt="After" />
      </div>
      {/* Draggable divider */}
      <div
        className="absolute top-0 bottom-0 w-1 -translate-x-1/2 cursor-ew-resize z-10 group"
        style={{ left: `${splitPct}%` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-0.5 bg-white/80 shadow-lg" />
        {/* Handle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path
              d="M3 2L1 5L3 8M7 2L9 5L7 8"
              stroke="#666"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
      {/* Labels */}
      <span className="absolute top-2 left-3 text-[10px] font-medium text-white/70 bg-black/30 px-1.5 py-0.5 rounded pointer-events-none">
        Before
      </span>
      <span className="absolute top-2 right-3 text-[10px] font-medium text-white/70 bg-black/30 px-1.5 py-0.5 rounded pointer-events-none">
        After
      </span>
    </div>
  )
}

function VerifyView({
  src,
  colCuts,
  rowCuts,
  gridColor,
  numCells,
}: {
  src: string
  colCuts: number[]
  rowCuts: number[]
  gridColor: string
  numCells?: number | null
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const baseCanvasRef = useRef<HTMLCanvasElement>(null)
  const magCanvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const [canvasSize, setCanvasSize] = useState<{ w: number; h: number } | null>(null)
  const [canvasOffset, setCanvasOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const mouseRef = useRef<{ x: number; y: number } | null>(null)
  const [mouseVisible, setMouseVisible] = useState(false)
  const rafRef = useRef<number>(0)

  const MAG_DIAMETER = 200
  const MAG_RADIUS = MAG_DIAMETER / 2
  const ZOOM = 8
  const BORDER = 4

  // Draw base image
  useEffect(() => {
    const container = containerRef.current
    const canvas = baseCanvasRef.current
    if (!container || !canvas) return

    const img = new Image()
    img.onload = () => {
      const { width: cw, height: ch } = container.getBoundingClientRect()
      const scale = Math.min(cw / img.width, ch / img.height)
      let dw = Math.floor(img.width * scale)
      let dh = Math.floor(img.height * scale)
      if (numCells && numCells > 0) {
        const cellPx = Math.max(1, Math.floor(Math.min(dw, dh) / numCells))
        dw = cellPx * numCells
        dh = cellPx * numCells
      }
      canvas.width = dw
      canvas.height = dh
      const ctx = canvas.getContext('2d')!
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(img, 0, 0, dw, dh)
      imgRef.current = img
      setCanvasSize({ w: dw, h: dh })
      // Compute canvas offset within container
      const ox = Math.floor((cw - dw) / 2)
      const oy = Math.floor((ch - dh) / 2)
      setCanvasOffset({ x: ox, y: oy })
    }
    img.src = src
  }, [src, numCells])

  // Draw magnifier
  const drawMagnifier = useCallback(() => {
    const magCanvas = magCanvasRef.current
    const baseCanvas = baseCanvasRef.current
    const mouse = mouseRef.current
    if (!magCanvas || !baseCanvas || !mouse || !canvasSize) return

    const ctx = magCanvas.getContext('2d')!
    ctx.clearRect(0, 0, MAG_DIAMETER, MAG_DIAMETER)

    // Mouse position relative to canvas
    const cx = mouse.x - canvasOffset.x
    const cy = mouse.y - canvasOffset.y

    // Source region in display-canvas pixels
    const viewRadius = MAG_RADIUS / ZOOM
    const inner = MAG_DIAMETER - BORDER * 2

    // Clip to circle
    ctx.save()
    ctx.beginPath()
    ctx.arc(MAG_RADIUS, MAG_RADIUS, MAG_RADIUS - BORDER, 0, Math.PI * 2)
    ctx.clip()

    // Draw zoomed image
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(
      baseCanvas,
      cx - viewRadius,
      cy - viewRadius,
      viewRadius * 2,
      viewRadius * 2,
      BORDER,
      BORDER,
      inner,
      inner,
    )

    // Draw grid lines in magnified space using actual cuts
    // cuts are in image coordinates; scale to display coordinates
    const imgW = colCuts[colCuts.length - 1] || 1
    const imgH = rowCuts[rowCuts.length - 1] || 1
    const scaleX = canvasSize.w / imgW
    const scaleY = canvasSize.h / imgH

    ctx.strokeStyle = gridColor
    ctx.lineWidth = 1
    ctx.globalAlpha = 0.6

    // Effective zoom must match drawImage scaling (inner / source region)
    const effectiveZoom = inner / (viewRadius * 2)

    // Image boundary in magnifier coordinates
    const imgLeft = (0 - (cx - viewRadius)) * effectiveZoom + BORDER
    const imgTop = (0 - (cy - viewRadius)) * effectiveZoom + BORDER
    const imgRight = (canvasSize.w - (cx - viewRadius)) * effectiveZoom + BORDER
    const imgBottom = (canvasSize.h - (cy - viewRadius)) * effectiveZoom + BORDER

    // Clamp to magnifier inner area
    const drawLeft = Math.max(BORDER, imgLeft)
    const drawTop = Math.max(BORDER, imgTop)
    const drawRight = Math.min(MAG_DIAMETER - BORDER, imgRight)
    const drawBottom = Math.min(MAG_DIAMETER - BORDER, imgBottom)

    // Vertical lines
    for (let i = 1; i < colCuts.length - 1; i++) {
      const lineX = colCuts[i] * scaleX
      const magX = (lineX - (cx - viewRadius)) * effectiveZoom + BORDER
      if (magX >= drawLeft && magX <= drawRight) {
        ctx.beginPath()
        ctx.moveTo(magX, drawTop)
        ctx.lineTo(magX, drawBottom)
        ctx.stroke()
      }
    }
    // Horizontal lines
    for (let i = 1; i < rowCuts.length - 1; i++) {
      const lineY = rowCuts[i] * scaleY
      const magY = (lineY - (cy - viewRadius)) * effectiveZoom + BORDER
      if (magY >= drawTop && magY <= drawBottom) {
        ctx.beginPath()
        ctx.moveTo(drawLeft, magY)
        ctx.lineTo(drawRight, magY)
        ctx.stroke()
      }
    }

    ctx.restore()

    // Draw border ring
    ctx.beginPath()
    ctx.arc(MAG_RADIUS, MAG_RADIUS, MAG_RADIUS - BORDER / 2, 0, Math.PI * 2)
    ctx.strokeStyle = 'white'
    ctx.lineWidth = BORDER
    ctx.stroke()
  }, [canvasSize, canvasOffset, colCuts, rowCuts, gridColor, MAG_RADIUS])

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const container = containerRef.current
      if (!container) return
      const rect = container.getBoundingClientRect()
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
      if (!mouseVisible) setMouseVisible(true)

      // Position magnifier element
      const magCanvas = magCanvasRef.current
      if (magCanvas) {
        magCanvas.style.left = `${mouseRef.current.x - MAG_RADIUS}px`
        magCanvas.style.top = `${mouseRef.current.y - MAG_RADIUS}px`
      }

      cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(drawMagnifier)
    },
    [drawMagnifier, mouseVisible, MAG_RADIUS],
  )

  const handleMouseLeave = useCallback(() => {
    mouseRef.current = null
    setMouseVisible(false)
  }, [])

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full rounded-xl overflow-hidden bg-[repeating-conic-gradient(var(--checkerboard)_0%_25%,transparent_0%_50%)_0_0/16px_16px]"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ cursor: mouseVisible ? 'none' : 'default' }}
    >
      <div className="w-full h-full flex items-center justify-center">
        <div className="relative">
          <canvas ref={baseCanvasRef} />
          {canvasSize && (
            <SnapGridOverlay
              width={canvasSize.w}
              height={canvasSize.h}
              colCuts={colCuts}
              rowCuts={rowCuts}
              color={gridColor}
            />
          )}
        </div>
      </div>
      <canvas
        ref={magCanvasRef}
        width={MAG_DIAMETER}
        height={MAG_DIAMETER}
        className="absolute pointer-events-none"
        style={{
          display: mouseVisible ? 'block' : 'none',
          borderRadius: '50%',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}
      />
    </div>
  )
}

export function PreviewArea() {
  const { resultDataUrl, originalCroppedDataUrl, colCuts, rowCuts, numCells } = useConversionStore()
  const { viewMode, pixelateMode, gridOverlay, gridColor, setViewMode } = useSettingsStore()
  const [canvasSize, setCanvasSize] = useState<{ w: number; h: number } | null>(null)

  // ESC key to exit verify mode
  useEffect(() => {
    if (viewMode !== 'verify') return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setViewMode('after')
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [viewMode, setViewMode])

  const handleCanvasSize = useCallback((w: number, h: number) => {
    setCanvasSize({ w, h })
  }, [])

  if (!resultDataUrl || !originalCroppedDataUrl) return null

  const showSnapGrid = pixelateMode === 'snap' && gridOverlay && colCuts && rowCuts && canvasSize

  if (viewMode === 'before') {
    return (
      <div className="w-full h-full rounded-xl overflow-hidden bg-[repeating-conic-gradient(var(--checkerboard)_0%_25%,transparent_0%_50%)_0_0/16px_16px]">
        <ZoomablePixelCanvas src={originalCroppedDataUrl} alt="Before" className="rounded-xl" />
      </div>
    )
  }

  if (viewMode === 'after') {
    return (
      <div className="relative w-full h-full rounded-xl overflow-hidden bg-[repeating-conic-gradient(var(--checkerboard)_0%_25%,transparent_0%_50%)_0_0/16px_16px]">
        <ZoomablePixelCanvas
          src={resultDataUrl}
          alt="After"
          className="rounded-xl"
          numCells={numCells}
          onCanvasSize={handleCanvasSize}
        >
          {showSnapGrid && canvasSize && (
            <SnapGridOverlay
              width={canvasSize.w}
              height={canvasSize.h}
              colCuts={colCuts!}
              rowCuts={rowCuts!}
              color={gridColor}
            />
          )}
        </ZoomablePixelCanvas>
      </div>
    )
  }

  if (viewMode === 'compare') {
    return <CompareView beforeSrc={originalCroppedDataUrl} afterSrc={resultDataUrl} />
  }

  if (viewMode === 'verify' && colCuts && rowCuts) {
    return (
      <VerifyView
        src={resultDataUrl}
        colCuts={colCuts}
        rowCuts={rowCuts}
        gridColor={gridColor}
        numCells={numCells}
      />
    )
  }

  return null
}
