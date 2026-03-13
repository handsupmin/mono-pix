import logoSrc from '@/assets/logo-small.png'
import { cn } from '@/lib/utils'
import { useConversionStore } from '@/stores/conversion.store'
import { useCropStore } from '@/stores/crop.store'
import { useSettingsStore } from '@/stores/settings.store'
import { useUploadStore } from '@/stores/upload.store'
import { Pencil, Trash2 } from 'lucide-react'
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
  const { status, reset: resetConversion } = useConversionStore()
  const { reset: resetCrop } = useCropStore()
  const { gridOverlay, gridColor } = useSettingsStore()

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

          {/* Header action buttons */}
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

          {/* Floating Back to Edit button */}
          {isDone && !isConverting && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30">
              <button
                onClick={handleBackToEdit}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors text-sm font-medium"
              >
                <Pencil className="w-3.5 h-3.5" />
                {t('controls.backToEdit')}
              </button>
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
