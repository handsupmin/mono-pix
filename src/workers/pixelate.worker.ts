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

// Quantize a channel value to the nearest bucket for frequency counting
const Q = 8
const quantize = (v: number) => Math.round(v / Q) * Q

function getCellColorAverage(
  data: Uint8ClampedArray,
  width: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): [number, number, number, number] {
  let rSum = 0,
    gSum = 0,
    bSum = 0,
    aSum = 0
  let transparentCount = 0
  let totalPixels = 0

  for (let py = y0; py < y1; py++) {
    for (let px = x0; px < x1; px++) {
      const idx = (py * width + px) * 4
      const a = data[idx + 3]
      totalPixels++
      aSum += a
      if (a < 128) {
        transparentCount++
      } else {
        rSum += data[idx]
        gSum += data[idx + 1]
        bSum += data[idx + 2]
      }
    }
  }

  if (totalPixels === 0) return [0, 0, 0, 0]
  if (transparentCount > totalPixels / 2) return [0, 0, 0, 0]

  const visibleCount = totalPixels - transparentCount
  return [
    visibleCount > 0 ? Math.round(rSum / visibleCount) : 0,
    visibleCount > 0 ? Math.round(gSum / visibleCount) : 0,
    visibleCount > 0 ? Math.round(bSum / visibleCount) : 0,
    Math.round(aSum / totalPixels),
  ]
}

function getCellColorFrequent(
  data: Uint8ClampedArray,
  width: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): [number, number, number, number] {
  const freq = new Map<string, { count: number; r: number; g: number; b: number; a: number }>()
  let transparentCount = 0
  let totalPixels = 0

  for (let py = y0; py < y1; py++) {
    for (let px = x0; px < x1; px++) {
      const idx = (py * width + px) * 4
      const a = data[idx + 3]
      totalPixels++
      if (a < 128) {
        transparentCount++
        continue
      }
      const r = quantize(data[idx])
      const g = quantize(data[idx + 1])
      const b = quantize(data[idx + 2])
      const key = `${r},${g},${b}`
      const entry = freq.get(key)
      if (entry) {
        entry.count++
      } else {
        freq.set(key, { count: 1, r, g, b, a })
      }
    }
  }

  if (totalPixels === 0) return [0, 0, 0, 0]
  if (transparentCount > totalPixels / 2) return [0, 0, 0, 0]

  let best = { count: 0, r: 0, g: 0, b: 0, a: 255 }
  for (const entry of freq.values()) {
    if (entry.count > best.count) best = entry
  }

  return [best.r, best.g, best.b, best.a]
}

self.onmessage = async (e: MessageEvent<PixelateRequest>) => {
  const { imageData, resolution, outputMode, pixelateMode } = e.data
  const { width, height, data } = imageData

  const postProgress = (step: number, total: number, message: string) => {
    self.postMessage({ type: 'progress', step, total, message } satisfies PixelateResponse)
  }

  const getColor = pixelateMode === 'frequent' ? getCellColorFrequent : getCellColorAverage

  try {
    postProgress(0, 4, 'preparingCrop')

    const cellW = width / resolution
    const cellH = height / resolution

    postProgress(1, 4, 'samplingColors')

    const cellColors = new Uint8ClampedArray(resolution * resolution * 4)

    for (let row = 0; row < resolution; row++) {
      for (let col = 0; col < resolution; col++) {
        const x0 = Math.round(col * cellW)
        const y0 = Math.round(row * cellH)
        const x1 = Math.round((col + 1) * cellW)
        const y1 = Math.round((row + 1) * cellH)
        const [r, g, b, a] = getColor(data, width, x0, y0, x1, y1)
        const cellIdx = (row * resolution + col) * 4
        cellColors[cellIdx] = r
        cellColors[cellIdx + 1] = g
        cellColors[cellIdx + 2] = b
        cellColors[cellIdx + 3] = a
      }
    }

    postProgress(2, 4, 'renderingPixel')

    let outputImageData: ImageData

    if (outputMode === 'resized') {
      outputImageData = new ImageData(resolution, resolution)
      for (let i = 0; i < cellColors.length; i++) {
        outputImageData.data[i] = cellColors[i]
      }
    } else {
      outputImageData = new ImageData(width, height)
      for (let row = 0; row < resolution; row++) {
        for (let col = 0; col < resolution; col++) {
          const cellIdx = (row * resolution + col) * 4
          const r = cellColors[cellIdx]
          const g = cellColors[cellIdx + 1]
          const b = cellColors[cellIdx + 2]
          const a = cellColors[cellIdx + 3]

          const x0 = Math.round(col * cellW)
          const y0 = Math.round(row * cellH)
          const x1 = Math.round((col + 1) * cellW)
          const y1 = Math.round((row + 1) * cellH)

          for (let py = y0; py < y1; py++) {
            for (let px = x0; px < x1; px++) {
              const idx = (py * width + px) * 4
              outputImageData.data[idx] = r
              outputImageData.data[idx + 1] = g
              outputImageData.data[idx + 2] = b
              outputImageData.data[idx + 3] = a
            }
          }
        }
      }
    }

    postProgress(3, 4, 'finalizingPreview')

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
