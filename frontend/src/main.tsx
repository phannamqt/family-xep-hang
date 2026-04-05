import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import Layout from './components/Layout'
import QueuePage from './pages/queue/QueuePage'
import CheckInPage from './pages/visits/CheckInPage'
import VisitsPage from './pages/visits/VisitsPage'
import PatientsPage from './pages/patients/PatientsPage'
import ConfigPage from './pages/config/ConfigPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30000 },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/queue" replace />} />
            <Route path="queue" element={<QueuePage />} />
            <Route path="checkin" element={<CheckInPage />} />
            <Route path="visits" element={<VisitsPage />} />
            <Route path="patients" element={<PatientsPage />} />
            <Route path="config" element={<ConfigPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
