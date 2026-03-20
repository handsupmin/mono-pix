import { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUploadStore } from '@/stores/upload.store'
import { useCropStore } from '@/stores/crop.store'
import { useConversionStore } from '@/stores/conversion.store'

const SUPPORTED = ['image/png', 'image/jpeg', 'image/webp']
const MAX_SIZE = 20 * 1024 * 1024

function validateFile(file: File): string | null {
  if (!SUPPORTED.includes(file.type)) return 'errors.unsupportedFormat'
  if (file.size > MAX_SIZE) return 'errors.fileTooLarge'
  return null
}

export function UploadZone() {
  const { t } = useTranslation()
  const { setImage } = useUploadStore()
  const { reset: resetCrop } = useCropStore()
  const { reset: resetConversion } = useConversionStore()
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const processFile = useCallback(
    (file: File) => {
      const err = validateFile(file)
      if (err) {
        setError(t(err))
        return
      }
      setError(null)
      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string
        const img = new Image()
        img.onload = () => {
          if (img.naturalWidth < 8 || img.naturalHeight < 8) {
            setError(t('errors.imageTooSmall'))
            return
          }
          resetCrop()
          resetConversion()
          setImage({
            file,
            dataUrl,
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight,
          })
        }
        img.onerror = () => setError(t('errors.fileReadFailed'))
        img.src = dataUrl
      }
      reader.onerror = () => setError(t('errors.fileReadFailed'))
      reader.readAsDataURL(file)
    },
    [t, setImage, resetCrop, resetConversion],
  )

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }
  const onDragLeave = () => setIsDragging(false)
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }
  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    e.target.value = ''
  }

  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-4">
      <div
        className={cn(
          'flex flex-col items-center justify-center w-full h-full max-h-[480px] rounded-xl border-2 border-dashed cursor-pointer transition-colors',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50 hover:bg-muted/30',
        )}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={SUPPORTED.join(',')}
          className="hidden"
          onChange={onInputChange}
        />
        <div className="flex flex-col items-center gap-3 pointer-events-none select-none p-8">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <Upload className="w-6 h-6 text-muted-foreground" />
          </div>
          {isDragging ? (
            <p className="text-base font-medium text-primary">{t('upload.dragActive')}</p>
          ) : (
            <>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{t('upload.placeholder')}</span>
                <span className="text-primary font-medium underline underline-offset-2">
                  {t('upload.button')}
                </span>
              </div>
              <p className="text-xs text-muted-foreground/70">{t('upload.formats')}</p>
            </>
          )}
        </div>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
