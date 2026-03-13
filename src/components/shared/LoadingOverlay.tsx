import { useTranslation } from 'react-i18next'
import { useConversionStore } from '@/stores/conversion.store'
import { PixelProgressBar } from './PixelProgressBar'

export function LoadingOverlay() {
  const { t } = useTranslation()
  const { status, progress } = useConversionStore()

  if (status !== 'converting') return null

  const progressValue = progress.total > 0 ? progress.step / progress.total : 0
  const progressPct = Math.round(progressValue * 100)

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm rounded-xl">
      <div className="flex flex-col items-center gap-4 w-64">
        <div className="flex flex-col items-center gap-1">
          <p
            className="text-sm font-medium text-foreground"
            style={{ fontFamily: 'KenneyMini, monospace' }}
          >
            {progress.messageKey ? t(`progress.${progress.messageKey}`) : ''}
          </p>
          <p className="text-xs text-muted-foreground">{progressPct}%</p>
        </div>
        <PixelProgressBar progress={progressValue} className="w-full" />
      </div>
    </div>
  )
}
