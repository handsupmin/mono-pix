import { create } from 'zustand'
import type { HistoryItem } from '@/lib/db'
import { getAllHistory, deleteHistoryItem, clearHistory } from '@/lib/db'

interface HistoryState {
  items: HistoryItem[]
  isVisible: boolean
  load: () => Promise<void>
  removeItem: (id: number) => Promise<void>
  clearAll: () => Promise<void>
  setVisible: (v: boolean) => void
}

export const useHistoryStore = create<HistoryState>((set) => ({
  items: [],
  isVisible: true,
  load: async () => {
    const items = await getAllHistory()
    set({ items })
  },
  removeItem: async (id) => {
    await deleteHistoryItem(id)
    const items = await getAllHistory()
    set({ items })
  },
  clearAll: async () => {
    await clearHistory()
    set({ items: [] })
  },
  setVisible: (isVisible) => set({ isVisible }),
}))
