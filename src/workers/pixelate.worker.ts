import { fitResolutionToAspect, pixelate, snap } from 'fast-pixelizer'

export type PixelateRequest = {
  imageData: ImageData
  resolution: number
  pixelateMode: 'average' | 'frequent' | 'snap'
  colorVariety?: number
}

export type PixelateResponse =
  | { type: 'progress'; step: number; total: number; message: string }
  | {
      type: 'done'
      originalResult: ImageData
      resizedResult: ImageData
      detectedResolution?: number
      colCuts?: number[]
      rowCuts?: number[]
    }
  | { type: 'error'; message: string }

function toImageData(result: { data: Uint8ClampedArray; width: number; height: number }) {
  return new ImageData(new Uint8ClampedArray(result.data), result.width, result.height)
}

/**
 * Collapse an already-snapped image to one pixel per detected cell.
 *
 * `snap(..., { output: 'original' })` deliberately keeps the source layout for
 * phase-offset genuine pixel art. Sampling its returned cuts preserves that
 * behavior while letting one grid analysis produce both downloadable sizes.
 */
function collapseToGrid(image: ImageData, colCuts: number[], rowCuts: number[]): ImageData {
  const cols = colCuts.length - 1
  const rows = rowCuts.length - 1
  const data = new Uint8ClampedArray(cols * rows * 4)

  for (let row = 0; row < rows; row++) {
    const yStart = rowCuts[row]
    const yEnd = rowCuts[row + 1]
    for (let col = 0; col < cols; col++) {
      const xStart = colCuts[col]
      const xEnd = colCuts[col + 1]
      const frequencies = new Map<number, number>()

      for (let y = yStart; y < yEnd; y++) {
        for (let x = xStart; x < xEnd; x++) {
          const index = (y * image.width + x) * 4
          const key =
            ((image.data[index] << 24) |
              (image.data[index + 1] << 16) |
              (image.data[index + 2] << 8) |
              image.data[index + 3]) >>>
            0
          frequencies.set(key, (frequencies.get(key) ?? 0) + 1)
        }
      }

      let bestKey = 0
      let bestCount = 0
      for (const [key, count] of frequencies) {
        if (count > bestCount) {
          bestKey = key
          bestCount = count
        }
      }

      const outputIndex = (row * cols + col) * 4
      data[outputIndex] = (bestKey >>> 24) & 0xff
      data[outputIndex + 1] = (bestKey >>> 16) & 0xff
      data[outputIndex + 2] = (bestKey >>> 8) & 0xff
      data[outputIndex + 3] = bestKey & 0xff
    }
  }

  return new ImageData(data, cols, rows)
}

/** Paint a grid-sized pixel result back across the crop without resampling it. */
function expandGridToSize(grid: ImageData, width: number, height: number): ImageData {
  const data = new Uint8ClampedArray(width * height * 4)
  const cellWidth = width / grid.width
  const cellHeight = height / grid.height

  for (let row = 0; row < grid.height; row++) {
    const yStart = Math.round(row * cellHeight)
    const yEnd = Math.round((row + 1) * cellHeight)
    for (let col = 0; col < grid.width; col++) {
      const xStart = Math.round(col * cellWidth)
      const xEnd = Math.round((col + 1) * cellWidth)
      const sourceIndex = (row * grid.width + col) * 4

      for (let y = yStart; y < yEnd; y++) {
        for (let x = xStart; x < xEnd; x++) {
          const outputIndex = (y * width + x) * 4
          data[outputIndex] = grid.data[sourceIndex]
          data[outputIndex + 1] = grid.data[sourceIndex + 1]
          data[outputIndex + 2] = grid.data[sourceIndex + 2]
          data[outputIndex + 3] = grid.data[sourceIndex + 3]
        }
      }
    }
  }

  return new ImageData(data, width, height)
}

// ─── Main message handler ────────────────────────────────────────────────────

self.onmessage = (e: MessageEvent<PixelateRequest>) => {
  const { imageData, resolution, pixelateMode, colorVariety } = e.data

  const post = (step: number, total: number, message: string) =>
    self.postMessage({ type: 'progress', step, total, message } satisfies PixelateResponse)

  try {
    if (pixelateMode === 'snap') {
      post(0, 5, 'preparingCrop')
      post(1, 5, 'samplingColors')
      const snapped = snap(imageData, {
        colorVariety: colorVariety ?? 32,
        output: 'original',
      })
      post(2, 5, 'detectingGrid')
      post(3, 5, 'renderingPixel')
      const originalResult = toImageData(snapped)
      const resizedResult = collapseToGrid(originalResult, snapped.colCuts, snapped.rowCuts)
      post(4, 5, 'finalizingPreview')
      self.postMessage(
        {
          type: 'done',
          originalResult,
          resizedResult,
          detectedResolution: snapped.detectedResolution,
          colCuts: snapped.colCuts,
          rowCuts: snapped.rowCuts,
        } satisfies PixelateResponse,
        { transfer: [originalResult.data.buffer, resizedResult.data.buffer] },
      )
    } else {
      post(0, 4, 'preparingCrop')
      post(1, 4, 'samplingColors')

      const result = pixelate(imageData, {
        resolution: fitResolutionToAspect(imageData, resolution),
        mode: pixelateMode === 'frequent' ? 'clean' : 'detail',
        output: 'resized',
      })

      post(2, 4, 'renderingPixel')

      const resizedResult = toImageData(result)
      const originalResult = expandGridToSize(resizedResult, imageData.width, imageData.height)

      post(3, 4, 'finalizingPreview')

      self.postMessage({ type: 'done', originalResult, resizedResult } satisfies PixelateResponse, {
        transfer: [originalResult.data.buffer, resizedResult.data.buffer],
      })
    }
  } catch (err) {
    self.postMessage({
      type: 'error',
      message: err instanceof Error ? err.message : 'Unknown error',
    } satisfies PixelateResponse)
  }
}
