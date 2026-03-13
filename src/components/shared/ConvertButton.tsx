import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { useConversionStore } from '@/stores/conversion.store'
import { useUploadStore } from '@/stores/upload.store'
import { useCropStore } from '@/stores/crop.store'
import { useSettingsStore } from '@/stores/settings.store'
import { useValidResolutions } from '@/hooks/useValidResolutions'
import { useConvert } from '@/hooks/useConvert'

export function ConvertButton() {
  const { t } = useTranslation()
  const { status } = useConversionStore()
  const { image } = useUploadStore()
  const { croppedAreaPixels } = useCropStore()
  const { resolution } = useSettingsStore()
  const validResolutions = useValidResolutions()
  const { convert } = useConvert()

  const isConverting = status === 'converting'
  const isDisabled =
    isConverting || !image || !croppedAreaPixels || !validResolutions.has(resolution)

  return (
    <button
      onClick={() => void convert()}
      disabled={isDisabled}
      className={cn(
        'group relative w-full py-3 px-6 font-semibold text-sm',
        'bg-primary text-primary-foreground rounded-lg',
        'transition-all duration-150',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        // On hover: sharp corners, pixel font kicks in via group-hover on inner span
        'hover:rounded-none',
      )}
    >
      <span
        className={cn(
          'transition-all duration-150',
          // Normal state: Pretendard, tracking normal
          'font-semibold tracking-wide',
          // Hover: pixel font, wider tracking
          'group-hover:[font-family:KenneyMini,monospace] group-hover:tracking-widest group-hover:text-base',
        )}
      >
        {t('controls.convert')}
      </span>
    </button>
  )
}
