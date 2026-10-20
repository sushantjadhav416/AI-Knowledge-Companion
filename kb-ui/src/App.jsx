import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { Toaster } from 'react-hot-toast'
import theme from './theme'
import { AppProvider } from './context/AppContext'
import AppLayout from './components/layout/AppLayout'
import Library        from './pages/Library'
import DocumentDetail from './pages/DocumentDetail'
import Chat           from './pages/Chat'
import Search         from './pages/Search'
import Flashcards     from './pages/Flashcards'
import Settings       from './pages/Settings'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AppProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<AppLayout />}>
                <Route path="/"                  element={<Library />} />
                <Route path="/documents/:id"     element={<DocumentDetail />} />
                <Route path="/chat"              element={<Chat />} />
                <Route path="/search"            element={<Search />} />
                <Route path="/flashcards"        element={<Flashcards />} />
                <Route path="/settings"          element={<Settings />} />
              </Route>
            </Routes>
          </BrowserRouter>
          <Toaster position="bottom-right" toastOptions={{
            style: { borderRadius: 10, fontSize: '0.875rem', fontFamily: 'Inter, sans-serif' },
          }} />
        </AppProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
