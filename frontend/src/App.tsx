import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useUIStore } from './store/uiStore'
import { Header } from './components/layout/Header'
import { Sidebar } from './components/layout/Sidebar'
import { GraphView } from './components/graph/GraphView'
import { BubblesView } from './components/bubbles/BubblesView'
import './styles.css'

const queryClient = new QueryClient()

function AppContent() {
  const viewType = useUIStore((s) => s.viewType)

  return (
    <div className="app">
      <Header />
      <div className="app__body">
        <Sidebar />
        <main className="app__main">
          {viewType === 'graph' && <GraphView />}
          {viewType === 'bubbles' && <BubblesView />}
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  )
}
