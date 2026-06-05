import './assets/main.css'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './app'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Don't refetch on window focus — data only changes via our own mutations
      refetchOnWindowFocus: false,
      staleTime: Number.POSITIVE_INFINITY
    }
  }
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
)
