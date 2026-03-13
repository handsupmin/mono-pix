import { pixelate } from 'fast-pixelizer'

export type PixelateRequest = {
  imageData: ImageData
  resolution: number
  outputMode: 'original-size' | 'resized'
  pixelateMode: 'average' | 'frequent'
}

export type PixelateResponse =
  | { type: 'progress'; step: number; total: number; message: string }
  | { type: 'done'; result: ImageData }
  | { type: 'error'; message: string }

self.onmessage = (e: MessageEvent<PixelateRequest>) => {
  const { imageData, resolution, outputMode, pixelateMode } = e.data

  const post = (step: number, message: string) =>
    self.postMessage({ type: 'progress', step, total: 4, message } satisfies PixelateResponse)

  try {
    post(0, 'preparingCrop')
    post(1, 'samplingColors')

    const result = pixelate(imageData, {
      resolution,
      mode: pixelateMode === 'frequent' ? 'clean' : 'detail',
      output: outputMode === 'resized' ? 'resized' : 'original',
    })

    post(2, 'renderingPixel')

    const outputImageData = new ImageData(
      new Uint8ClampedArray(result.data),
      result.width,
      result.height,
    )

    post(3, 'finalizingPreview')

    self.postMessage({ type: 'done', result: outputImageData } satisfies PixelateResponse, {
      transfer: [outputImageData.data.buffer],
    })
  } catch (err) {
    self.postMessage({
      type: 'error',
      message: err instanceof Error ? err.message : 'Unknown error',
    } satisfies PixelateResponse)
  }
}
