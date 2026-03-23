import demoSrc from '@/assets/demo-rpg.png'
import { useConversionStore } from '@/stores/conversion.store'
import { useCropStore } from '@/stores/crop.store'
import { useUploadStore } from '@/stores/upload.store'
import { ImagePlay } from 'lucide-react'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

function dataURLToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',')
  const mime = header.match(/:(.*?);/)![1]
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

export function TryDemoFab() {
  const { t } = useTranslation()
  const { setImage } = useUploadStore()
  const { reset: resetCrop } = useCropStore()
  const { reset: resetConversion } = useConversionStore()

  const handleTryDemo = useCallback(() => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      const dataUrl = canvas.toDataURL('image/png')
      const blob = dataURLToBlob(dataUrl)
      const file = new File([blob], 'demo-rpg.png', { type: 'image/png' })
      resetCrop()
      resetConversion()
      setImage({
        file,
        dataUrl,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
      })
    }
    img.src = demoSrc
  }, [setImage, resetCrop, resetConversion])

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30">
      <button
        onClick={handleTryDemo}
        className="group relative flex items-center gap-2 px-5 py-2.5 rounded-full bg-black/80 text-white text-sm font-medium transition-all hover:scale-[1.03] dark:bg-white/90 dark:text-gray-900 dark:hover:bg-white overflow-hidden"
      >
        {/* Rainbow corona glow */}
        <span
          className="pointer-events-none absolute -inset-[3px] rounded-full blur-[6px] group-hover:blur-[10px]"
          style={{
            background:
              'conic-gradient(from 0deg, #ff6b6b, #feca57, #48dbfb, #ff9ff3, #54a0ff, #5f27cd, #ff6b6b)',
            animation: 'demo-breathe-1 2.3s ease-in-out infinite',
            opacity: 0.75,
          }}
        />
        <span
          className="pointer-events-none absolute -inset-[2px] rounded-full blur-md group-hover:blur-lg"
          style={{
            background:
              'conic-gradient(from 120deg, #ff9ff3, #54a0ff, #48dbfb, #feca57, #ff6b6b, #5f27cd, #ff9ff3)',
            animation: 'demo-breathe-2 1.8s ease-in-out infinite',
            opacity: 0.55,
          }}
        />
        <span
          className="pointer-events-none absolute -inset-[4px] rounded-full blur-lg group-hover:blur-xl"
          style={{
            background:
              'conic-gradient(from 240deg, #48dbfb, #5f27cd, #ff6b6b, #54a0ff, #feca57, #ff9ff3, #48dbfb)',
            animation: 'demo-breathe-3 2.7s ease-in-out infinite',
            opacity: 0.4,
          }}
        />
        <style>{`
          @keyframes demo-breathe-1 {
            0%, 100% { transform: scale(1); opacity: 0.7; }
            50% { transform: scale(1.12); opacity: 0.9; }
          }
          @keyframes demo-breathe-2 {
            0%, 100% { transform: scale(1.05); opacity: 0.5; }
            50% { transform: scale(0.93); opacity: 0.8; }
          }
          @keyframes demo-breathe-3 {
            0%, 100% { transform: scale(1.08); opacity: 0.4; }
            35% { transform: scale(0.92); opacity: 0.7; }
            70% { transform: scale(1.18); opacity: 0.55; }
          }
        `}</style>
        <span className="relative z-10 flex items-center gap-2">
          <ImagePlay className="w-4 h-4" />
          {t('upload.tryDemo')}
        </span>
      </button>
    </div>
  )
}
