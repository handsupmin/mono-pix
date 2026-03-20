import logoSrc from '@/assets/logo.png'
import { cn } from '@/lib/utils'
import { useConversionStore } from '@/stores/conversion.store'
import { useCropStore } from '@/stores/crop.store'
import { useSettingsStore } from '@/stores/settings.store'
import { useUploadStore } from '@/stores/upload.store'
import { Pencil, Search, Trash2, X } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CropEditor } from './crop/CropEditor'
import { HistoryPanel } from './history/HistoryPanel'
import { PreviewArea } from './preview/PreviewArea'
import { LoadingOverlay } from './shared/LoadingOverlay'
import { ControlPanel } from './sidebar/ControlPanel'
import { Button } from './ui/button'
import { UploadZone } from './upload/UploadZone'

const SUPPORTED = ['image/png', 'image/jpeg', 'image/webp']
const MAX_SIZE = 20 * 1024 * 1024

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent)

function ShortcutHints({ isDone, viewMode }: { isDone: boolean; viewMode: string }) {
  const { t } = useTranslation()
  const mod = isMac ? '⌘' : 'Ctrl'

  let hints: string[] = []
  if (!isDone) {
    // Crop mode
    hints = [t('hints.scrollZoom', { mod }), t('hints.dragPan')]
  } else if (viewMode === 'verify') {
    hints = [t('hints.escExit')]
  } else if (viewMode === 'before' || viewMode === 'after') {
    hints = [t('hints.scrollZoom', { mod }), t('hints.dragPan'), t('hints.dblClickReset')]
  }

  if (hints.length === 0) return null

  return (
    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60">
      {hints.map((hint, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-muted-foreground/30">·</span>}
          {hint}
        </span>
      ))}
    </div>
  )
}

function useGlobalDrop(onFile: (file: File) => void) {
  const [isDragging, setIsDragging] = useState(false)
  const dragCounter = useRef(0)

  const onDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    dragCounter.current++
    if (e.dataTransfer.types.includes('Files')) setIsDragging(true)
  }, [])

  const onDragLeave = useCallback(() => {
    dragCounter.current--
    if (dragCounter.current <= 0) {
      dragCounter.current = 0
      setIsDragging(false)
    }
  }, [])

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      dragCounter.current = 0
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) onFile(file)
    },
    [onFile],
  )

  return { isDragging, onDragEnter, onDragLeave, onDragOver, onDrop }
}

export function MainLayout() {
  const { t } = useTranslation()
  const { image, setImage } = useUploadStore()
  const { status, detectedResolution, colCuts, reset: resetConversion } = useConversionStore()
  const { reset: resetCrop } = useCropStore()
  const { gridOverlay, gridColor, pixelateMode, viewMode, setViewMode } = useSettingsStore()

  const isDone = status === 'done'
  const isConverting = status === 'converting'
  const hasImage = !!image

  const processDroppedFile = useCallback(
    (file: File) => {
      if (!SUPPORTED.includes(file.type)) return
      if (file.size > MAX_SIZE) return
      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string
        const img = new Image()
        img.onload = () => {
          if (img.naturalWidth < 8 || img.naturalHeight < 8) return
          resetCrop()
          resetConversion()
          setImage({
            file,
            dataUrl,
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight,
          })
        }
        img.src = dataUrl
      }
      reader.readAsDataURL(file)
    },
    [setImage, resetCrop, resetConversion],
  )

  const { isDragging, onDragEnter, onDragLeave, onDragOver, onDrop } =
    useGlobalDrop(processDroppedFile)

  const handleDeleteImage = () => {
    setImage(null)
    resetCrop()
    resetConversion()
  }

  const handleBackToEdit = () => {
    resetConversion()
  }

  return (
    <div className="flex h-full">
      {/* Left: Main area */}
      <div
        className="flex-1 flex flex-col min-w-0"
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <img src={logoSrc} alt="MonoPix logo" className="w-7 h-7 object-contain" />
            <span
              className="text-xl font-semibold tracking-tight text-foreground"
              style={{ fontFamily: 'DungGeunMo, monospace' }}
            >
              MonoPix
            </span>
          </div>

          {/* Header: shortcut hints + action buttons */}
          <div className="flex items-center gap-3">
            {hasImage && !isConverting && (
              <ShortcutHints isDone={isDone} viewMode={viewMode} />
            )}
            {hasImage && !isConverting && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDeleteImage}
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Canvas area */}
        <div
          className={cn(
            'relative flex-1 min-h-0 transition-colors',
            // Preview mode: subtle tinted background to distinguish from edit
            isDone ? 'bg-muted/20 p-4' : 'p-4',
          )}
        >
          {!hasImage ? (
            <UploadZone />
          ) : isDone ? (
            <PreviewArea />
          ) : (
            <CropEditor imageUrl={image.dataUrl} showGrid={gridOverlay} gridColor={gridColor} />
          )}
          <LoadingOverlay />

          {/* Floating action buttons */}
          {isDone && !isConverting && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
              <button
                onClick={handleBackToEdit}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors text-sm font-medium"
              >
                <Pencil className="w-3.5 h-3.5" />
                {t('controls.backToEdit')}
              </button>

              {pixelateMode === 'snap' && detectedResolution && colCuts && (
                <button
                  onClick={() => setViewMode(viewMode === 'verify' ? 'after' : 'verify')}
                  className={cn(
                    'group relative flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all overflow-hidden',
                    viewMode === 'verify'
                      ? 'bg-muted text-muted-foreground shadow-lg hover:bg-muted/80'
                      : 'bg-black/80 text-white hover:scale-[1.03] dark:bg-white/90 dark:text-gray-900 dark:hover:bg-white',
                  )}
                >
                  {/* Animated rainbow corona border glow (only when not active) */}
                  {viewMode !== 'verify' && (
                    <>
                      {/* Rainbow conic base - static */}
                      <span
                        className="pointer-events-none absolute -inset-[3px] rounded-full blur-[6px] group-hover:blur-[10px]"
                        style={{
                          background: 'conic-gradient(from 0deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3, #54a0ff, #5f27cd, #ff6b6b)',
                          animation: 'corona-breathe-1 2.3s ease-in-out infinite',
                          opacity: 0.75,
                        }}
                      />
                      {/* Pulse ring 1 */}
                      <span
                        className="pointer-events-none absolute -inset-[2px] rounded-full blur-md group-hover:blur-lg"
                        style={{
                          background: 'conic-gradient(from 120deg, #ff9ff3, #54a0ff, #48dbfb, #feca57, #ff6b6b, #5f27cd, #ff9ff3)',
                          animation: 'corona-breathe-2 1.8s ease-in-out infinite',
                          opacity: 0.55,
                        }}
                      />
                      {/* Pulse ring 2 */}
                      <span
                        className="pointer-events-none absolute -inset-[4px] rounded-full blur-lg group-hover:blur-xl"
                        style={{
                          background: 'conic-gradient(from 240deg, #48dbfb, #5f27cd, #ff6b6b, #54a0ff, #feca57, #ff9ff3, #48dbfb)',
                          animation: 'corona-breathe-3 2.7s ease-in-out infinite',
                          opacity: 0.4,
                        }}
                      />
                      <style>{`
                        @keyframes corona-breathe-1 {
                          0%, 100% { transform: scale(1); opacity: 0.7; }
                          50% { transform: scale(1.12); opacity: 0.9; }
                        }
                        @keyframes corona-breathe-2 {
                          0%, 100% { transform: scale(1.05); opacity: 0.5; }
                          50% { transform: scale(0.93); opacity: 0.8; }
                        }
                        @keyframes corona-breathe-3 {
                          0%, 100% { transform: scale(1.08); opacity: 0.4; }
                          35% { transform: scale(0.92); opacity: 0.7; }
                          70% { transform: scale(1.18); opacity: 0.55; }
                        }
                      `}</style>
                    </>
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    {viewMode === 'verify' ? (
                      <>
                        <X className="w-3.5 h-3.5" />
                        {t('controls.turnOffMonocle')}
                      </>
                    ) : (
                      <>
                        <Search className="w-3.5 h-3.5" />
                        {t('controls.inspectMonocle')}
                      </>
                    )}
                  </span>
                </button>
              )}
            </div>
          )}

          {/* Global drag overlay */}
          {isDragging && (
            <div className="absolute inset-0 z-40 flex items-center justify-center rounded-xl border-2 border-dashed border-primary bg-primary/5 backdrop-blur-sm">
              <p className="text-base font-semibold text-primary">{t('upload.dragActive')}</p>
            </div>
          )}
        </div>

        {/* History panel at bottom */}
        <HistoryPanel />
      </div>

      {/* Right: Control panel */}
      <div className="w-56 shrink-0 border-l border-border flex flex-col">
        <ControlPanel />
      </div>
    </div>
  )
}
