import { TooltipProvider } from '@/components/ui/tooltip'
import { MainLayout } from '@/components/MainLayout'
import '@/lib/i18n'

function App() {
  return (
    <TooltipProvider>
      <MainLayout />
    </TooltipProvider>
  )
}

export default App
