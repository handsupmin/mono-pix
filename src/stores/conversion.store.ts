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
  detectedResolution: number | null
  colCuts: number[] | null
  rowCuts: number[] | null
  numCells: number | null
  progress: ProgressState
  errorKey: string | null
  setConverting: (progress: ProgressState) => void
  setDone: (
    resultDataUrl: string,
    originalCroppedDataUrl: string,
    detectedResolution?: number,
    colCuts?: number[],
    rowCuts?: number[],
    numCells?: number,
  ) => void
  setError: (errorKey: string) => void
  reset: () => void
}

export const useConversionStore = create<ConversionState>((set) => ({
  status: 'idle',
  resultDataUrl: null,
  originalCroppedDataUrl: null,
  detectedResolution: null,
  colCuts: null,
  rowCuts: null,
  numCells: null,
  progress: { step: 0, total: 4, messageKey: '' },
  errorKey: null,
  setConverting: (progress) => set({ status: 'converting', progress, errorKey: null }),
  setDone: (
    resultDataUrl,
    originalCroppedDataUrl,
    detectedResolution,
    colCuts,
    rowCuts,
    numCells,
  ) =>
    set({
      status: 'done',
      resultDataUrl,
      originalCroppedDataUrl,
      detectedResolution: detectedResolution ?? null,
      colCuts: colCuts ?? null,
      rowCuts: rowCuts ?? null,
      numCells: numCells ?? null,
    }),
  setError: (errorKey) => set({ status: 'error', errorKey }),
  reset: () =>
    set({
      status: 'idle',
      resultDataUrl: null,
      originalCroppedDataUrl: null,
      detectedResolution: null,
      colCuts: null,
      rowCuts: null,
      numCells: null,
      progress: { step: 0, total: 4, messageKey: '' },
      errorKey: null,
    }),
}))
