import { create } from 'zustand'
import type { Point, Area, Size } from 'react-easy-crop'

interface CropState {
  crop: Point
  zoom: number
  aspectRatio: { width: number; height: number }
  cropSize: Size | null
  croppedAreaPixels: Area | null
  setCrop: (crop: Point) => void
  setZoom: (zoom: number) => void
  setAspectRatio: (width: number, height: number) => void
  setCropSizeAndAspectRatio: (cropSize: Size, width: number, height: number) => void
  resetForImage: (width: number, height: number) => void
  setCroppedAreaPixels: (area: Area | null) => void
  reset: () => void
}

function gcd(a: number, b: number): number {
  let x = Math.abs(Math.trunc(a))
  let y = Math.abs(Math.trunc(b))
  while (y > 0) {
    const next = x % y
    x = y
    y = next
  }
  return x || 1
}

export function normalizeAspectRatio(width: number, height: number) {
  const ratio = sanitizeAspectRatio(width, height)
  const divisor = gcd(ratio.width, ratio.height)

  return {
    width: ratio.width / divisor,
    height: ratio.height / divisor,
  }
}

function sanitizeAspectRatio(width: number, height: number) {
  const safeWidth = Math.max(1, Math.trunc(width) || 1)
  const safeHeight = Math.max(1, Math.trunc(height) || 1)

  return {
    width: safeWidth,
    height: safeHeight,
  }
}

const DEFAULT: Pick<CropState, 'crop' | 'zoom' | 'aspectRatio' | 'cropSize' | 'croppedAreaPixels'> =
  {
    crop: { x: 0, y: 0 },
    zoom: 1,
    aspectRatio: { width: 1, height: 1 },
    cropSize: null,
    croppedAreaPixels: null,
  }

export const useCropStore = create<CropState>((set) => ({
  ...DEFAULT,
  setCrop: (crop) => set({ crop }),
  setZoom: (zoom) => set({ zoom }),
  setAspectRatio: (width, height) =>
    set({
      aspectRatio: sanitizeAspectRatio(width, height),
      cropSize: null,
      croppedAreaPixels: null,
    }),
  setCropSizeAndAspectRatio: (cropSize, width, height) =>
    set({
      cropSize,
      aspectRatio: sanitizeAspectRatio(width, height),
      croppedAreaPixels: null,
    }),
  resetForImage: (width, height) =>
    set({
      ...DEFAULT,
      aspectRatio: normalizeAspectRatio(width, height),
    }),
  setCroppedAreaPixels: (croppedAreaPixels) => set({ croppedAreaPixels }),
  reset: () => set(DEFAULT),
}))
