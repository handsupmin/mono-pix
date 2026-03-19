import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const RESOLUTIONS = [8, 16, 32, 64, 128, 256] as const
export type Resolution = (typeof RESOLUTIONS)[number]
export type OutputMode = 'original-size' | 'resized'
export type PixelateMode = 'average' | 'frequent' | 'snap'
export type ViewMode = 'before' | 'after' | 'compare' | 'verify'
export type Language = 'en' | 'ko' | 'ja' | 'zh' | 'es'

export const COLOR_VARIETIES = [8, 16, 24, 32, 64, 128, 256] as const
export type ColorVariety = (typeof COLOR_VARIETIES)[number]

interface SettingsState {
  resolution: Resolution
  outputMode: OutputMode
  pixelateMode: PixelateMode
  viewMode: ViewMode
  gridOverlay: boolean
  gridColor: string
  language: Language
  colorVariety: ColorVariety
  darkMode: boolean
  setResolution: (r: Resolution) => void
  setOutputMode: (m: OutputMode) => void
  setPixelateMode: (m: PixelateMode) => void
  setViewMode: (v: ViewMode) => void
  setGridOverlay: (v: boolean) => void
  setGridColor: (c: string) => void
  setLanguage: (l: Language) => void
  setColorVariety: (v: ColorVariety) => void
  setDarkMode: (v: boolean) => void
  resetSettings: () => void
}

const DEFAULTS = {
  resolution: 32 as Resolution,
  outputMode: 'original-size' as OutputMode,
  pixelateMode: 'snap' as PixelateMode,
  viewMode: 'before' as ViewMode,
  gridOverlay: false,
  gridColor: '#ffffff',
  language: 'en' as Language,
  colorVariety: 256 as ColorVariety,
  darkMode: false,
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
      setColorVariety: (colorVariety) => set({ colorVariety }),
      setDarkMode: (darkMode) => set({ darkMode }),
      resetSettings: () =>
        set({
          resolution: DEFAULTS.resolution,
          outputMode: DEFAULTS.outputMode,
          pixelateMode: DEFAULTS.pixelateMode,
          viewMode: DEFAULTS.viewMode,
          colorVariety: DEFAULTS.colorVariety,
        }),
    }),
    {
      name: 'monopix-settings',
      partialize: (state) => ({
        language: state.language,
        outputMode: state.outputMode,
        darkMode: state.darkMode,
      }),
    },
  ),
)
