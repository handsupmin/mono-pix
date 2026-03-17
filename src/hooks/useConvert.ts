import { useCallback } from 'react'
import { useCropStore } from '@/stores/crop.store'
import { useUploadStore } from '@/stores/upload.store'
import { useSettingsStore } from '@/stores/settings.store'
import { useConversionStore } from '@/stores/conversion.store'
import { useHistoryStore } from '@/stores/history.store'
import { addHistoryItem } from '@/lib/db'
import type { PixelateRequest, PixelateResponse } from '@/workers/pixelate.worker'

function getCroppedImageData(
  image: HTMLImageElement,
  pixelCrop: { x: number; y: number; width: number; height: number },
): ImageData {
  const x = Math.round(pixelCrop.x)
  const y = Math.round(pixelCrop.y)
  const w = Math.round(pixelCrop.width)
  const h = Math.round(pixelCrop.height)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.imageSmoothingEnabled = false
  ctx.drawImage(image, x, y, w, h, 0, 0, w, h)
  return ctx.getImageData(0, 0, w, h)
}

function imageDataToDataUrl(imageData: ImageData): string {
  const canvas = document.createElement('canvas')
  canvas.width = imageData.width
  canvas.height = imageData.height
  const ctx = canvas.getContext('2d')!
  ctx.putImageData(imageData, 0, 0)
  return canvas.toDataURL('image/png')
}

function generateThumbnail(dataUrl: string, size = 80): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, size, size)
      resolve(canvas.toDataURL('image/png'))
    }
    img.src = dataUrl
  })
}

export function useConvert() {
  const { croppedAreaPixels } = useCropStore()
  const { image } = useUploadStore()
  const { resolution, outputMode, pixelateMode, setViewMode } = useSettingsStore()
  const { setConverting, setDone, setError } = useConversionStore()
  const { load } = useHistoryStore()

  const convert = useCallback(async () => {
    if (!image || !croppedAreaPixels) return

    const img = new Image()
    img.src = image.dataUrl

    await new Promise<void>((resolve) => {
      if (img.complete) resolve()
      else img.onload = () => resolve()
    })

    const imageData = getCroppedImageData(img, croppedAreaPixels)
    const originalCroppedDataUrl = imageDataToDataUrl(imageData)

    const worker = new Worker(new URL('@/workers/pixelate.worker.ts', import.meta.url), {
      type: 'module',
    })

    worker.onmessage = async (e: MessageEvent<PixelateResponse>) => {
      const msg = e.data
      if (msg.type === 'progress') {
        setConverting({ step: msg.step, total: msg.total, messageKey: msg.message })
      } else if (msg.type === 'done') {
        const resultDataUrl = imageDataToDataUrl(msg.result)
        const thumbnailDataUrl = await generateThumbnail(resultDataUrl)

        await addHistoryItem({
          originalFileName: image.file.name,
          createdAt: Date.now(),
          resolution: msg.detectedResolution ?? resolution,
          outputMode,
          resultDataUrl,
          thumbnailDataUrl,
          cropWidth: croppedAreaPixels.width,
          cropHeight: croppedAreaPixels.height,
        })

        await load()
        setViewMode('after')
        setDone(resultDataUrl, originalCroppedDataUrl, msg.detectedResolution)
        worker.terminate()
      } else if (msg.type === 'error') {
        setError('errors.canvasFailed')
        worker.terminate()
      }
    }

    worker.onerror = () => {
      setError('errors.canvasFailed')
      worker.terminate()
    }

    const request: PixelateRequest = {
      imageData,
      resolution,
      outputMode,
      pixelateMode,
    }

    worker.postMessage(request, [imageData.data.buffer])
  }, [
    image,
    croppedAreaPixels,
    resolution,
    outputMode,
    pixelateMode,
    setViewMode,
    setConverting,
    setDone,
    setError,
    load,
  ])

  return { convert }
}
