import { pixelate } from 'fast-pixelizer'

export type PixelateRequest = {
  imageData: ImageData
  resolution: number
  outputMode: 'original-size' | 'resized'
  pixelateMode: 'average' | 'frequent' | 'repair'
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
      debugLog?: string
    }
  | { type: 'error'; message: string }

// ─── Repair mode: grid detection & re-snap ───────────────────────────────────

// Seeded PRNG (mulberry32) — deterministic results on same image
function makePrng(seed: number) {
  let s = seed
  return () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// K-means++ quantization: spreads initial centroids far apart for better palette
function kmeansQuantize(
  data: Uint8ClampedArray,
  pixelCount: number,
  k = 16,
  maxIter = 15,
): Uint8ClampedArray {
  const rng = makePrng(42)

  const opaque: number[] = []
  for (let i = 0; i < pixelCount; i++) {
    if (data[i * 4 + 3] > 0) opaque.push(i)
  }
  if (opaque.length === 0) return new Uint8ClampedArray(data)

  const n = opaque.length
  const actualK = Math.min(k, n)

  // Sample up to 50k pixels for centroid estimation
  const sampleSize = Math.min(n, 50000)
  const stride = n / sampleSize
  const sample: number[] = []
  for (let i = 0; i < sampleSize; i++) sample.push(opaque[Math.floor(i * stride)])

  // K-means++ initialization: each centroid is chosen with probability ∝ distance²
  const centroids = new Float32Array(actualK * 3)
  const distances = new Float32Array(sampleSize).fill(Infinity)

  const firstIdx = Math.floor(rng() * sampleSize)
  const fp = sample[firstIdx] * 4
  centroids[0] = data[fp]
  centroids[1] = data[fp + 1]
  centroids[2] = data[fp + 2]

  for (let ki = 1; ki < actualK; ki++) {
    // Update min-distances using last centroid only (incremental)
    let sumDist = 0
    const cx = centroids[(ki - 1) * 3]
    const cy = centroids[(ki - 1) * 3 + 1]
    const cz = centroids[(ki - 1) * 3 + 2]
    for (let si = 0; si < sampleSize; si++) {
      const pi = sample[si] * 4
      const dr = data[pi] - cx
      const dg = data[pi + 1] - cy
      const db = data[pi + 2] - cz
      const d = dr * dr + dg * dg + db * db
      if (d < distances[si]) distances[si] = d
      sumDist += distances[si]
    }

    // Sample next centroid proportional to distance²
    let chosen = sampleSize - 1
    if (sumDist > 0) {
      let target = rng() * sumDist
      for (let si = 0; si < sampleSize; si++) {
        target -= distances[si]
        if (target <= 0) {
          chosen = si
          break
        }
      }
    } else {
      chosen = Math.floor(rng() * sampleSize)
    }
    const cp = sample[chosen] * 4
    centroids[ki * 3] = data[cp]
    centroids[ki * 3 + 1] = data[cp + 1]
    centroids[ki * 3 + 2] = data[cp + 2]
  }

  // Lloyd's iterations on sample
  const sums = new Float64Array(actualK * 3)
  const counts = new Int32Array(actualK)
  for (let iter = 0; iter < maxIter; iter++) {
    sums.fill(0)
    counts.fill(0)
    let moved = false

    for (let si = 0; si < sampleSize; si++) {
      const pi = sample[si] * 4
      const r = data[pi],
        g = data[pi + 1],
        b = data[pi + 2]
      let bestK = 0,
        bestDist = Infinity
      for (let ki = 0; ki < actualK; ki++) {
        const dr = r - centroids[ki * 3]
        const dg = g - centroids[ki * 3 + 1]
        const db = b - centroids[ki * 3 + 2]
        const d = dr * dr + dg * dg + db * db
        if (d < bestDist) {
          bestDist = d
          bestK = ki
        }
      }
      sums[bestK * 3] += r
      sums[bestK * 3 + 1] += g
      sums[bestK * 3 + 2] += b
      counts[bestK]++
    }

    for (let ki = 0; ki < actualK; ki++) {
      if (counts[ki] > 0) {
        const nr = sums[ki * 3] / counts[ki]
        const ng = sums[ki * 3 + 1] / counts[ki]
        const nb = sums[ki * 3 + 2] / counts[ki]
        const delta =
          Math.abs(nr - centroids[ki * 3]) +
          Math.abs(ng - centroids[ki * 3 + 1]) +
          Math.abs(nb - centroids[ki * 3 + 2])
        if (delta > 0.01) moved = true
        centroids[ki * 3] = nr
        centroids[ki * 3 + 1] = ng
        centroids[ki * 3 + 2] = nb
      }
    }
    if (!moved) break
  }

  // Apply to all pixels; preserve alpha channel as-is
  const result = new Uint8ClampedArray(data)
  for (let i = 0; i < pixelCount; i++) {
    if (data[i * 4 + 3] === 0) continue
    const r = data[i * 4],
      g = data[i * 4 + 1],
      b = data[i * 4 + 2]
    let bestK = 0,
      bestDist = Infinity
    for (let ki = 0; ki < actualK; ki++) {
      const dr = r - centroids[ki * 3]
      const dg = g - centroids[ki * 3 + 1]
      const db = b - centroids[ki * 3 + 2]
      const d = dr * dr + dg * dg + db * db
      if (d < bestDist) {
        bestDist = d
        bestK = ki
      }
    }
    result[i * 4] = Math.round(centroids[bestK * 3])
    result[i * 4 + 1] = Math.round(centroids[bestK * 3 + 1])
    result[i * 4 + 2] = Math.round(centroids[bestK * 3 + 2])
    // result[i * 4 + 3] untouched — alpha preserved from original
  }
  return result
}

function computeColProfile(data: Uint8ClampedArray, width: number, height: number): Float64Array {
  const profile = new Float64Array(width)
  for (let y = 0; y < height; y++) {
    for (let x = 1; x < width - 1; x++) {
      const li = (y * width + x - 1) * 4
      const ri = (y * width + x + 1) * 4
      const lg =
        data[li + 3] === 0 ? 0 : 0.299 * data[li] + 0.587 * data[li + 1] + 0.114 * data[li + 2]
      const rg =
        data[ri + 3] === 0 ? 0 : 0.299 * data[ri] + 0.587 * data[ri + 1] + 0.114 * data[ri + 2]
      profile[x] += Math.abs(rg - lg)
    }
  }
  return profile
}

function computeRowProfile(data: Uint8ClampedArray, width: number, height: number): Float64Array {
  const profile = new Float64Array(height)
  for (let x = 0; x < width; x++) {
    for (let y = 1; y < height - 1; y++) {
      const ti = ((y - 1) * width + x) * 4
      const bi = ((y + 1) * width + x) * 4
      const tg =
        data[ti + 3] === 0 ? 0 : 0.299 * data[ti] + 0.587 * data[ti + 1] + 0.114 * data[ti + 2]
      const bg =
        data[bi + 3] === 0 ? 0 : 0.299 * data[bi] + 0.587 * data[bi + 1] + 0.114 * data[bi + 2]
      profile[y] += Math.abs(bg - tg)
    }
  }
  return profile
}

function estimateStep(profile: Float64Array, minDist = 4): number | null {
  let maxVal = 0
  for (let i = 0; i < profile.length; i++) if (profile[i] > maxVal) maxVal = profile[i]
  if (maxVal === 0) return null

  const threshold = maxVal * 0.2
  const peaks: number[] = []
  for (let i = 1; i < profile.length - 1; i++) {
    if (profile[i] > threshold && profile[i] > profile[i - 1] && profile[i] > profile[i + 1]) {
      peaks.push(i)
    }
  }
  if (peaks.length < 2) return null

  const clean = [peaks[0]]
  for (let i = 1; i < peaks.length; i++) {
    if (peaks[i] - clean[clean.length - 1] >= minDist) clean.push(peaks[i])
  }
  if (clean.length < 2) return null

  const diffs: number[] = []
  for (let i = 1; i < clean.length; i++) diffs.push(clean[i] - clean[i - 1])
  diffs.sort((a, b) => a - b)
  return diffs[Math.floor(diffs.length / 2)]
}

function walk(profile: Float64Array, stepSize: number, limit: number): number[] {
  const cuts = [0]
  let pos = 0
  const searchWindow = Math.max(2, stepSize * 0.35)
  let mean = 0
  for (let i = 0; i < profile.length; i++) mean += profile[i]
  mean /= profile.length

  while (pos < limit) {
    const target = pos + stepSize
    if (target >= limit) {
      cuts.push(limit)
      break
    }
    const start = Math.max(Math.ceil(pos + 1), Math.floor(target - searchWindow))
    const end = Math.min(limit, Math.ceil(target + searchWindow))
    let maxVal = -1,
      maxIdx = Math.round(target)
    for (let i = start; i < end; i++) {
      if (profile[i] > maxVal) {
        maxVal = profile[i]
        maxIdx = i
      }
    }
    if (maxVal > mean * 0.5) {
      cuts.push(maxIdx)
      pos = maxIdx
    } else {
      const next = Math.round(target)
      cuts.push(next)
      pos = next
    }
  }
  return cuts
}

// Axis stabilization: if one axis step is >1.8× the other, re-walk using the smaller step
function stabilizeAxes(
  colProfile: Float64Array,
  rowProfile: Float64Array,
  colCuts: number[],
  rowCuts: number[],
  colStep: number,
  rowStep: number,
  width: number,
  height: number,
): { colCuts: number[]; rowCuts: number[] } {
  const maxRatio = 1.8
  const ratio = colStep > rowStep ? colStep / rowStep : rowStep / colStep
  if (ratio <= maxRatio) return { colCuts, rowCuts }

  if (colStep > rowStep) {
    return { colCuts: walk(colProfile, rowStep, width), rowCuts }
  } else {
    return { colCuts, rowCuts: walk(rowProfile, colStep, height) }
  }
}

// Minimum cells guarantee: if fewer than 4 cells detected, fall back to limit/64 step
const MIN_CELLS = 4
const FALLBACK_SEGMENTS = 64

function ensureMinCuts(profile: Float64Array, cuts: number[], limit: number): number[] {
  if (cuts.length - 1 >= MIN_CELLS) return cuts
  const fallbackStep = Math.max(1, limit / FALLBACK_SEGMENTS)
  return walk(profile, fallbackStep, limit)
}

// Resample: majority voting using full RGBA as key — preserves transparency & semi-transparency
function resampleCells(
  data: Uint8ClampedArray,
  width: number,
  colCuts: number[],
  rowCuts: number[],
): Uint8ClampedArray {
  const numCols = colCuts.length - 1
  const numRows = rowCuts.length - 1
  const out = new Uint8ClampedArray(numCols * numRows * 4)

  for (let ri = 0; ri < numRows; ri++) {
    const ys = rowCuts[ri],
      ye = rowCuts[ri + 1]
    for (let ci = 0; ci < numCols; ci++) {
      const xs = colCuts[ci],
        xe = colCuts[ci + 1]
      const freq = new Map<number, number>()

      for (let py = ys; py < ye; py++) {
        for (let px = xs; px < xe; px++) {
          const i = (py * width + px) * 4
          // Full RGBA as key — alpha is part of the vote
          const key =
            ((data[i] << 24) | (data[i + 1] << 16) | (data[i + 2] << 8) | data[i + 3]) >>> 0
          freq.set(key, (freq.get(key) ?? 0) + 1)
        }
      }

      const outIdx = (ri * numCols + ci) * 4
      let bestKey = 0,
        bestCount = 0
      for (const [k, c] of freq) {
        if (c > bestCount) {
          bestCount = c
          bestKey = k
        }
      }
      out[outIdx] = (bestKey >>> 24) & 0xff
      out[outIdx + 1] = (bestKey >>> 16) & 0xff
      out[outIdx + 2] = (bestKey >>> 8) & 0xff
      out[outIdx + 3] = bestKey & 0xff
    }
  }
  return out
}

function repairPixelate(
  imageData: ImageData,
  outputMode: 'original-size' | 'resized',
  colorVariety: number,
): {
  data: Uint8ClampedArray
  width: number
  height: number
  detectedResolution: number
  colCuts: number[]
  rowCuts: number[]
  debugLog: string
} {
  const { width, height } = imageData
  const pixelCount = width * height

  const quantData = kmeansQuantize(imageData.data, pixelCount, colorVariety)
  const colProfile = computeColProfile(quantData, width, height)
  const rowProfile = computeRowProfile(quantData, width, height)

  const colStep = estimateStep(colProfile) ?? Math.max(1, Math.round(width / FALLBACK_SEGMENTS))
  const rowStep = estimateStep(rowProfile) ?? Math.max(1, Math.round(height / FALLBACK_SEGMENTS))

  // 1) Walk-based cuts: snaps to actual grid boundaries → accurate color sampling
  let colCuts = walk(colProfile, colStep, width)
  let rowCuts = walk(rowProfile, rowStep, height)

  ;({ colCuts, rowCuts } = stabilizeAxes(
    colProfile,
    rowProfile,
    colCuts,
    rowCuts,
    colStep,
    rowStep,
    width,
    height,
  ))
  colCuts = ensureMinCuts(colProfile, colCuts, width)
  rowCuts = ensureMinCuts(rowProfile, rowCuts, height)

  const numCols = colCuts.length - 1
  const numRows = rowCuts.length - 1
  const detectedResolution = Math.round((numCols + numRows) / 2)

  // Sample colors using walk cuts (accurate to actual grid boundaries)
  const cells = resampleCells(quantData, width, colCuts, rowCuts)

  // 2) Render with uniform cell size (every cell exactly the same pixel size)
  const cellSize = Math.floor(Math.min(width, height) / Math.max(numCols, numRows))
  const outW = cellSize * numCols
  const outH = cellSize * numRows

  // Uniform cuts for grid overlay
  const uniformColCuts: number[] = []
  const uniformRowCuts: number[] = []
  for (let i = 0; i <= numCols; i++) uniformColCuts.push(i * cellSize)
  for (let i = 0; i <= numRows; i++) uniformRowCuts.push(i * cellSize)

  // ── Debug ──
  const walkColSizes: number[] = []
  for (let i = 0; i < numCols; i++) walkColSizes.push(colCuts[i + 1] - colCuts[i])
  const walkRowSizes: number[] = []
  for (let i = 0; i < numRows; i++) walkRowSizes.push(rowCuts[i + 1] - rowCuts[i])
  const debugLog = [
    `=== Repair Mode Debug Log ===`,
    `timestamp: ${new Date().toISOString()}`,
    ``,
    `[input]  image: ${width}x${height}`,
    `[detect] colStep=${colStep}, rowStep=${rowStep}`,
    `[grid]   numCols=${numCols}, numRows=${numRows}`,
    ``,
    `[sampling] walk cuts (snapped to actual grid)`,
    `  col unique sizes: [${[...new Set(walkColSizes)].sort((a, b) => a - b).join(', ')}]`,
    `  row unique sizes: [${[...new Set(walkRowSizes)].sort((a, b) => a - b).join(', ')}]`,
    ``,
    `[rendering] uniform output`,
    `  cellSize=${cellSize}, outW=${outW}, outH=${outH}`,
    `  every cell = ${cellSize}x${cellSize}px → UNIFORM ✓`,
  ].join('\n')
  // ── End debug ──

  if (outputMode === 'original-size') {
    // Scale cells (1px each) to uniform cellSize blocks
    const result = new Uint8ClampedArray(outW * outH * 4)
    for (let ri = 0; ri < numRows; ri++) {
      for (let ci = 0; ci < numCols; ci++) {
        const cellIdx = (ri * numCols + ci) * 4
        const r = cells[cellIdx],
          g = cells[cellIdx + 1],
          b = cells[cellIdx + 2],
          a = cells[cellIdx + 3]
        const pyStart = ri * cellSize
        const pxStart = ci * cellSize
        for (let py = pyStart; py < pyStart + cellSize; py++) {
          for (let px = pxStart; px < pxStart + cellSize; px++) {
            const idx = (py * outW + px) * 4
            result[idx] = r
            result[idx + 1] = g
            result[idx + 2] = b
            result[idx + 3] = a
          }
        }
      }
    }
    return {
      data: result,
      width: outW,
      height: outH,
      detectedResolution,
      colCuts: uniformColCuts,
      rowCuts: uniformRowCuts,
      debugLog,
    }
  } else {
    return {
      data: cells,
      width: numCols,
      height: numRows,
      detectedResolution,
      colCuts: uniformColCuts,
      rowCuts: uniformRowCuts,
      debugLog,
    }
  }
}

// ─── Main message handler ────────────────────────────────────────────────────

self.onmessage = (e: MessageEvent<PixelateRequest>) => {
  const { imageData, resolution, outputMode, pixelateMode, colorVariety } = e.data

  const post = (step: number, total: number, message: string) =>
    self.postMessage({ type: 'progress', step, total, message } satisfies PixelateResponse)

  try {
    if (pixelateMode === 'repair') {
      post(0, 5, 'preparingCrop')
      post(1, 5, 'samplingColors')
      const repaired = repairPixelate(imageData, outputMode, colorVariety ?? 16)
      post(2, 5, 'detectingGrid')
      post(3, 5, 'renderingPixel')
      const outputImageData = new ImageData(
        new Uint8ClampedArray(repaired.data),
        repaired.width,
        repaired.height,
      )
      post(4, 5, 'finalizingPreview')
      self.postMessage(
        {
          type: 'done',
          result: outputImageData,
          detectedResolution: repaired.detectedResolution,
          colCuts: repaired.colCuts,
          rowCuts: repaired.rowCuts,
          numCells: repaired.colCuts.length - 1,
          debugLog: repaired.debugLog,
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
