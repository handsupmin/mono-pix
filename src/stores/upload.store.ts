import { create } from 'zustand'

export interface UploadedImage {
  file: File
  dataUrl: string
  naturalWidth: number
  naturalHeight: number
}

interface UploadState {
  image: UploadedImage | null
  setImage: (image: UploadedImage | null) => void
}

export const useUploadStore = create<UploadState>((set) => ({
  image: null,
  setImage: (image) => set({ image }),
}))
