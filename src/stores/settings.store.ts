import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const RESOLUTIONS = [8, 16, 32, 64, 128, 256] as const
export type Resolution = (typeof RESOLUTIONS)[number]
export type OutputMode = 'original-size' | 'resized'
export type PixelateMode = 'average' | 'frequent' | 'repair'
export type ViewMode = 'before' | 'after' | 'compare'
export type Language = 'en' | 'ko' | 'ja' | 'zh' | 'es'

interface SettingsState {
  resolution: Resolution
  outputMode: OutputMode
  pixelateMode: PixelateMode
  viewMode: ViewMode
  gridOverlay: boolean
  gridColor: string
  language: Language
  setResolution: (r: Resolution) => void
  setOutputMode: (m: OutputMode) => void
  setPixelateMode: (m: PixelateMode) => void
  setViewMode: (v: ViewMode) => void
  setGridOverlay: (v: boolean) => void
  setGridColor: (c: string) => void
  setLanguage: (l: Language) => void
  resetSettings: () => void
}

const DEFAULTS = {
  resolution: 32 as Resolution,
  outputMode: 'original-size' as OutputMode,
  pixelateMode: 'frequent' as PixelateMode,
  viewMode: 'before' as ViewMode,
  gridOverlay: false,
  gridColor: '#ffffff',
  language: 'en' as Language,
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULTS,
      setResolution: (resolution) => set({ resolution }),
      setOutputMode: (outputMode) => set({ outputMode }),
      setPixelateMode: (pixelateMode) => set({ pixelateMode }),
      setViewMode: (viewMode) => set({ viewMode }),
      setGridOverlay: (gridOverlay) => set({ gridOverlay }),
      setGridColor: (gridColor) => set({ gridColor }),
      setLanguage: (language) => set({ language }),
      resetSettings: () =>
        set({
          resolution: DEFAULTS.resolution,
          outputMode: DEFAULTS.outputMode,
          pixelateMode: DEFAULTS.pixelateMode,
          viewMode: DEFAULTS.viewMode,
        }),
    }),
    {
      name: 'monopix-settings',
      partialize: (state) => ({
        language: state.language,
        outputMode: state.outputMode,
      }),
    },
  ),
)
