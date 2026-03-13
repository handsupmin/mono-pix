import { create } from 'zustand'

export type ConversionStatus = 'idle' | 'converting' | 'done' | 'error'

interface ProgressState {
  step: number
  total: number
  messageKey: string
}

interface ConversionState {
  status: ConversionStatus
  resultDataUrl: string | null
  originalCroppedDataUrl: string | null
  progress: ProgressState
  errorKey: string | null
  setConverting: (progress: ProgressState) => void
  setDone: (resultDataUrl: string, originalCroppedDataUrl: string) => void
  setError: (errorKey: string) => void
  reset: () => void
}

export const useConversionStore = create<ConversionState>((set) => ({
  status: 'idle',
  resultDataUrl: null,
  originalCroppedDataUrl: null,
  progress: { step: 0, total: 4, messageKey: '' },
  errorKey: null,
  setConverting: (progress) => set({ status: 'converting', progress, errorKey: null }),
  setDone: (resultDataUrl, originalCroppedDataUrl) =>
    set({ status: 'done', resultDataUrl, originalCroppedDataUrl }),
  setError: (errorKey) => set({ status: 'error', errorKey }),
  reset: () =>
    set({
      status: 'idle',
      resultDataUrl: null,
      originalCroppedDataUrl: null,
      progress: { step: 0, total: 4, messageKey: '' },
      errorKey: null,
    }),
}))
