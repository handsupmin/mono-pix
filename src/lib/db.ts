import Dexie, { type Table } from 'dexie'

export interface HistoryItem {
  id?: number
  originalFileName: string
  createdAt: number
  resolution: number
  outputMode: 'original-size' | 'resized'
  resultDataUrl: string
  thumbnailDataUrl: string
  cropWidth: number
  cropHeight: number
}

class MonoPixDB extends Dexie {
  history!: Table<HistoryItem>

  constructor() {
    super('monopix')
    this.version(1).stores({
      history: '++id, createdAt',
    })
  }
}

export const db = new MonoPixDB()

export async function addHistoryItem(item: Omit<HistoryItem, 'id'>): Promise<number> {
  const id = await db.history.add(item)
  const count = await db.history.count()
  if (count > 10) {
    const oldest = await db.history.orderBy('createdAt').first()
    if (oldest?.id != null) {
      await db.history.delete(oldest.id)
    }
  }
  return id as number
}

export async function getAllHistory(): Promise<HistoryItem[]> {
  return db.history.orderBy('createdAt').reverse().toArray()
}

export async function deleteHistoryItem(id: number): Promise<void> {
  await db.history.delete(id)
}

export async function clearHistory(): Promise<void> {
  await db.history.clear()
}
