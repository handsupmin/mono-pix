import { create } from 'zustand'
import type { Point, Area } from 'react-easy-crop'

interface CropState {
  crop: Point
  zoom: number
  croppedAreaPixels: Area | null
  setCrop: (crop: Point) => void
  setZoom: (zoom: number) => void
  setCroppedAreaPixels: (area: Area | null) => void
  reset: () => void
}

const DEFAULT: Pick<CropState, 'crop' | 'zoom' | 'croppedAreaPixels'> = {
  crop: { x: 0, y: 0 },
  zoom: 1,
  croppedAreaPixels: null,
}

export const useCropStore = create<CropState>((set) => ({
  ...DEFAULT,
  setCrop: (crop) => set({ crop }),
  setZoom: (zoom) => set({ zoom }),
  setCroppedAreaPixels: (croppedAreaPixels) => set({ croppedAreaPixels }),
  reset: () => set(DEFAULT),
}))
