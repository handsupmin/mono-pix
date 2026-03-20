import { useEffect } from 'react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { MainLayout } from '@/components/MainLayout'
import { useSettingsStore } from '@/stores/settings.store'
import '@/lib/i18n'

function App() {
  const darkMode = useSettingsStore((s) => s.darkMode)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  return (
    <TooltipProvider>
      <MainLayout />
    </TooltipProvider>
  )
}

export default App
