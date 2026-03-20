import { pixelate, snap } from 'fast-pixelizer'

export type PixelateRequest = {
  imageData: ImageData
  resolution: number
  outputMode: 'original-size' | 'resized'
  pixelateMode: 'average' | 'frequent' | 'snap'
  colorVariety?: number
}

export type PixelateResponse =
  | { type: 'progress'; step: number; total: number; message: string }
  | {
      type: 'done'
      result: ImageData
      detectedResolution?: number
      colCuts?: number[]
      rowCuts?: number[]
      numCells?: number
    }
  | { type: 'error'; message: string }

// ─── Main message handler ────────────────────────────────────────────────────

self.onmessage = (e: MessageEvent<PixelateRequest>) => {
  const { imageData, resolution, outputMode, pixelateMode, colorVariety } = e.data

  const post = (step: number, total: number, message: string) =>
    self.postMessage({ type: 'progress', step, total, message } satisfies PixelateResponse)

  try {
    if (pixelateMode === 'snap') {
      post(0, 5, 'preparingCrop')
      post(1, 5, 'samplingColors')
      const snapped = snap(imageData, {
        colorVariety: colorVariety ?? 32,
        output: outputMode === 'resized' ? 'resized' : 'original',
      })
      post(2, 5, 'detectingGrid')
      post(3, 5, 'renderingPixel')
      const outputImageData = new ImageData(
        new Uint8ClampedArray(snapped.data),
        snapped.width,
        snapped.height,
      )
      post(4, 5, 'finalizingPreview')
      self.postMessage(
        {
          type: 'done',
          result: outputImageData,
          detectedResolution: snapped.detectedResolution,
          colCuts: snapped.colCuts,
          rowCuts: snapped.rowCuts,
          numCells: snapped.colCuts.length - 1,
        } satisfies PixelateResponse,
        { transfer: [outputImageData.data.buffer] },
      )
    } else {
      post(0, 4, 'preparingCrop')
      post(1, 4, 'samplingColors')

      const result = pixelate(imageData, {
        resolution,
        mode: pixelateMode === 'frequent' ? 'clean' : 'detail',
        output: outputMode === 'resized' ? 'resized' : 'original',
      })

      post(2, 4, 'renderingPixel')

      const outputImageData = new ImageData(
        new Uint8ClampedArray(result.data),
        result.width,
        result.height,
      )

      post(3, 4, 'finalizingPreview')

      self.postMessage({ type: 'done', result: outputImageData } satisfies PixelateResponse, {
        transfer: [outputImageData.data.buffer],
      })
    }
  } catch (err) {
    self.postMessage({
      type: 'error',
      message: err instanceof Error ? err.message : 'Unknown error',
    } satisfies PixelateResponse)
  }
}
