import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Download, Grid3x3, RotateCcw, ChevronDown, Check, Github } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  useSettingsStore,
  RESOLUTIONS,
  type Resolution,
  type OutputMode,
  type PixelateMode,
  type ViewMode,
  type Language,
} from '@/stores/settings.store'
import { useConversionStore } from '@/stores/conversion.store'
import { useUploadStore } from '@/stores/upload.store'
import { useCropStore } from '@/stores/crop.store'
import { useValidResolutions } from '@/hooks/useValidResolutions'
import { ConvertButton } from '@/components/shared/ConvertButton'
import { cn } from '@/lib/utils'
import i18n from '@/lib/i18n'

function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  a.click()
}

function buildFilename(originalName: string, resolution: number, outputMode: OutputMode) {
  const base = originalName.replace(/\.[^.]+$/, '')
  const mode = outputMode === 'original-size' ? 'original-size' : 'resized'
  return `${base}_${resolution}x${resolution}_${mode}.png`
}

const LANGUAGE_OPTIONS: { value: Language; label: string; native: string }[] = [
  { value: 'en', label: 'English', native: 'English' },
  { value: 'ko', label: 'Korean', native: '한국어' },
  { value: 'ja', label: 'Japanese', native: '日本語' },
  { value: 'zh', label: 'Chinese', native: '中文' },
  { value: 'es', label: 'Spanish', native: 'Español' },
]

function LanguageSelector() {
  const { t } = useTranslation()
  const { language, setLanguage } = useSettingsStore()
  const [open, setOpen] = useState(false)

  const current = LANGUAGE_OPTIONS.find((o) => o.value === language)

  const handleSelect = (lang: Language) => {
    setLanguage(lang)
    void i18n.changeLanguage(lang)
    setOpen(false)
  }

  return (
    <div className="px-4 py-2.5 flex items-center justify-between">
      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
        {t('controls.language')}
      </span>
      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded bg-muted hover:bg-muted/70 transition-colors min-w-[72px] justify-between"
        >
          <span>{current?.native}</span>
          <ChevronDown className={cn('w-3 h-3 transition-transform', open && 'rotate-180')} />
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute right-0 top-full mt-1 z-20 bg-popover border border-border rounded-md shadow-md py-1 min-w-[96px]">
              {LANGUAGE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleSelect(opt.value)}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-xs hover:bg-muted transition-colors"
                >
                  <span>{opt.native}</span>
                  {language === opt.value && <Check className="w-3 h-3 text-primary" />}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export function ControlPanel() {
  const { t } = useTranslation()
  const {
    resolution,
    outputMode,
    pixelateMode,
    viewMode,
    gridOverlay,
    gridColor,
    setResolution,
    setOutputMode,
    setPixelateMode,
    setViewMode,
    setGridOverlay,
    setGridColor,
    resetSettings,
  } = useSettingsStore()
  const colorInputRef = useRef<HTMLInputElement>(null)
  const { status, resultDataUrl, detectedResolution } = useConversionStore()
  const { image } = useUploadStore()
  const { croppedAreaPixels } = useCropStore()
  const validResolutions = useValidResolutions()

  // Auto-select largest valid resolution when crop changes invalidate current selection
  useEffect(() => {
    if (validResolutions.size > 0 && !validResolutions.has(resolution)) {
      const largest = [...validResolutions].at(-1)!
      setResolution(largest)
    }
  }, [validResolutions, resolution, setResolution])

  const isDone = status === 'done'
  const canDownload = isDone && !!resultDataUrl

  const handleDownload = () => {
    if (!resultDataUrl || !image) return
    downloadDataUrl(resultDataUrl, buildFilename(image.file.name, resolution, outputMode))
  }

  const outputSize = croppedAreaPixels
    ? outputMode === 'original-size'
      ? `${croppedAreaPixels.width} × ${croppedAreaPixels.height}`
      : pixelateMode === 'repair'
        ? isDone && detectedResolution
          ? `~${detectedResolution} × ${detectedResolution}`
          : t('controls.autoDetected')
        : `${resolution} × ${resolution}`
    : '—'

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* 0. GitHub */}
      <div className="px-4 py-2.5 flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
          GitHub
        </span>
        <a
          href="https://github.com/handsupmin/mono-pix"
          target="_blank"
          rel="noopener noreferrer"
          className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          title="GitHub"
        >
          <Github className="w-3.5 h-3.5" />
        </a>
      </div>
      <Separator />

      {/* 1. Language */}
      <LanguageSelector />
      <Separator />

      {/* 2. Reset Settings */}
      <div className="px-4 py-2.5 flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
          {t('controls.reset')}
        </span>
        <button
          onClick={resetSettings}
          className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
          title={t('controls.reset')}
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
      <Separator />

      {/* 3. Convert Type */}
      <div className="px-4 py-2.5 flex flex-col gap-2">
        <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
          {t('controls.convertType')}
        </label>
        <div className="flex gap-1">
          {(
            [
              ['frequent', t('controls.convertType1')],
              ['average', t('controls.convertType2')],
              ['repair', t('controls.convertType3')],
            ] as [PixelateMode, string][]
          ).map(([mode, label]) => (
            <button
              key={mode}
              onClick={() => setPixelateMode(mode)}
              className={cn(
                'flex-1 text-xs px-2 py-1 rounded-md font-medium transition-colors',
                pixelateMode === mode
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/70 text-foreground',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <Separator />

      {/* 4. Resolution (hidden in Repair mode) */}
      {pixelateMode !== 'repair' && (
        <>
          <div className="px-4 py-3 flex flex-col gap-2">
            <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              {t('controls.resolution')}
            </label>
            <div className="grid grid-cols-3 gap-1">
              {RESOLUTIONS.map((r) => {
                const isValid = validResolutions.has(r)
                return (
                  <button
                    key={r}
                    disabled={!isValid}
                    onClick={() => setResolution(r as Resolution)}
                    className={cn(
                      'text-xs py-1.5 rounded-md font-mono font-medium transition-colors',
                      resolution === r
                        ? 'bg-primary text-primary-foreground'
                        : isValid
                          ? 'bg-muted hover:bg-muted/70 text-foreground'
                          : 'bg-muted/30 text-muted-foreground/40 cursor-not-allowed',
                    )}
                  >
                    {r}×{r}
                  </button>
                )
              })}
            </div>
          </div>
          <Separator />
        </>
      )}

      {/* 5. Grid Overlay */}
      <div className="px-4 py-2.5 flex items-center justify-between">
        <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
          {t('controls.gridOverlay')}
        </label>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => colorInputRef.current?.click()}
            className="w-5 h-5 rounded border border-border transition-opacity hover:opacity-80"
            style={{ backgroundColor: gridColor }}
            title="Grid color"
            aria-label="Grid color"
          />
          <input
            ref={colorInputRef}
            type="color"
            value={gridColor}
            onChange={(e) => setGridColor(e.target.value)}
            className="sr-only"
            aria-hidden
          />
          <button
            onClick={() => setGridOverlay(!gridOverlay)}
            aria-label={t('controls.gridOverlay')}
            className={cn(
              'p-1.5 rounded transition-colors',
              gridOverlay
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground',
            )}
          >
            <Grid3x3 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <Separator />

      {/* 5. Output Mode */}
      <div className="px-4 py-3 flex flex-col gap-2">
        <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
          {t('controls.outputMode')}
        </label>
        <div className="flex flex-col gap-1">
          {(['original-size', 'resized'] as OutputMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setOutputMode(mode)}
              className={cn(
                'text-xs py-2 px-3 rounded-md text-left font-medium transition-colors',
                outputMode === mode
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/70 text-foreground',
              )}
            >
              {mode === 'original-size' ? t('controls.outputModeA') : t('controls.outputModeB')}
            </button>
          ))}
        </div>
      </div>

      {/* Output size info */}
      {croppedAreaPixels && (
        <>
          <Separator />
          <div className="px-4 py-2.5 flex flex-col gap-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">{t('preview.cropSize')}</span>
              <span className="font-mono font-medium">
                {croppedAreaPixels.width} × {croppedAreaPixels.height}
              </span>
            </div>
            {pixelateMode === 'repair' && isDone && detectedResolution ? (
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{t('controls.detectedResolution')}</span>
                <span className="font-mono font-medium">
                  ~{detectedResolution}×{detectedResolution}
                </span>
              </div>
            ) : (
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{t('preview.finalOutput')}</span>
                <span className="font-mono font-medium">{outputSize}</span>
              </div>
            )}
          </div>
        </>
      )}

      {/* 6. View Mode — only after conversion */}
      {isDone && (
        <>
          <Separator />
          <div className="px-4 py-3 flex flex-col gap-2">
            <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              {t('controls.viewMode')}
            </label>
            <div className="grid grid-cols-3 gap-1">
              {(
                [
                  ['before', t('controls.viewBefore')],
                  ['after', t('controls.viewAfter')],
                  ['compare', t('controls.viewCompare')],
                ] as [ViewMode, string][]
              ).map(([mode, label]) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={cn(
                    'text-xs py-1.5 rounded-md font-medium transition-colors',
                    viewMode === mode
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/70 text-foreground',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="flex-1" />

      {/* Actions */}
      <Separator />
      <div className="px-4 py-4 flex flex-col gap-2">
        <ConvertButton />
        <Button
          variant="outline"
          size="sm"
          disabled={!canDownload}
          onClick={handleDownload}
          className="w-full"
        >
          <Download className="w-3.5 h-3.5 mr-2" />
          {t('controls.download')}
        </Button>
      </div>
    </div>
  )
}
