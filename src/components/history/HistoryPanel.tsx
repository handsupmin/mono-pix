import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Trash2, Download, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useHistoryStore } from '@/stores/history.store'
import type { HistoryItem } from '@/lib/db'
import { cn } from '@/lib/utils'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'

function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  a.click()
}

function HistoryCard({ item, onDelete }: { item: HistoryItem; onDelete: () => void }) {
  const { t } = useTranslation()
  const filename = `${item.originalFileName.replace(/\.[^.]+$/, '')}_${item.resolution}x${item.resolution}_${item.outputMode}.png`

  return (
    <div className="group relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-border cursor-pointer hover:border-primary/60 transition-colors bg-[repeating-conic-gradient(#e5e5e5_0%_25%,transparent_0%_50%)_0_0/8px_8px]">
      <img
        src={item.thumbnailDataUrl}
        alt={item.originalFileName}
        className="w-full h-full object-cover"
        style={{ imageRendering: 'pixelated' }}
      />
      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation()
            downloadDataUrl(item.resultDataUrl, filename)
          }}
          title={t('history.download')}
          className="p-1 rounded bg-white/20 hover:bg-white/40 transition-colors"
        >
          <Download className="w-3 h-3 text-white" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          title={t('history.delete')}
          className="p-1 rounded bg-white/20 hover:bg-red-500/70 transition-colors"
        >
          <Trash2 className="w-3 h-3 text-white" />
        </button>
      </div>
      {/* Resolution badge */}
      <div className="absolute bottom-0.5 left-0.5 text-[9px] font-mono text-white/80 bg-black/40 px-0.5 rounded">
        {item.resolution}×{item.resolution}
      </div>
    </div>
  )
}

export function HistoryPanel() {
  const { t } = useTranslation()
  const { items, isVisible, load, removeItem, clearAll, setVisible } = useHistoryStore()
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    void load()
  }, [load])

  return (
    <>
      {showConfirm && (
        <ConfirmDialog
          title={t('history.clearConfirmTitle')}
          message={t('history.clearConfirmMessage')}
          confirmLabel={t('history.clearConfirmOk')}
          cancelLabel={t('history.clearConfirmCancel')}
          onConfirm={() => {
            void clearAll()
            setShowConfirm(false)
          }}
          onCancel={() => setShowConfirm(false)}
        />
      )}
      <div className="border-t border-border bg-background">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setVisible(!isVisible)}
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {isVisible ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronUp className="w-3.5 h-3.5" />
              )}
              {t('history.title')}
              {items.length > 0 && (
                <span className="text-[10px] text-muted-foreground/60">({items.length}/10)</span>
              )}
            </button>
          </div>
          {isVisible && items.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowConfirm(true)}
              className="h-6 text-xs text-muted-foreground hover:text-destructive px-2"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              {t('history.clearAll')}
            </Button>
          )}
        </div>

        {/* List */}
        {isVisible && (
          <div className={cn('px-4 pb-3', items.length === 0 && 'pb-3')}>
            {items.length === 0 ? (
              <p className="text-xs text-muted-foreground/60 text-center py-2">
                {t('history.empty')}
              </p>
            ) : (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {items.map((item) => (
                  <HistoryCard
                    key={item.id}
                    item={item}
                    onDelete={() => item.id != null && void removeItem(item.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
