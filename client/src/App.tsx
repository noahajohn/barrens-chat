import { AuthProvider, useAuth } from '@/features/auth/context/AuthContext'
import { ThemeProvider } from '@/features/theme/components/ThemeProvider'
import { ErrorBoundary } from '@/shared/components/ErrorBoundary'
import { ChatPage } from '@/pages/Chat'
import { LoginPage } from '@/pages/Login'

const AppContent = () => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-lg text-muted-foreground">Loading...</div>
      </div>
    )
  }

  // Simple path-based routing
  const path = window.location.pathname

  if (path === '/login' || !user) {
    return <LoginPage />
  }

  return <ChatPage />
}

const App = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App
