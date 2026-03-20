import { useMemo } from 'react'
import { RESOLUTIONS, type Resolution } from '@/stores/settings.store'
import { useCropStore } from '@/stores/crop.store'

export function useValidResolutions(): Set<Resolution> {
  const { croppedAreaPixels } = useCropStore()

  return useMemo(() => {
    if (!croppedAreaPixels) return new Set(RESOLUTIONS)
    const minDim = Math.min(croppedAreaPixels.width, croppedAreaPixels.height)
    return new Set(RESOLUTIONS.filter((r) => r <= minDim))
  }, [croppedAreaPixels])
}
