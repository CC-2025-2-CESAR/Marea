import { MotionConfig } from 'motion/react'
import { AuthProvider } from './contexts/AuthContext'
import ToastProvider from './components/ui/Toast/ToastProvider'
import AppRoutes from './routes/AppRoutes'

function App() {
  return (
    <MotionConfig reducedMotion="user">
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </MotionConfig>
  )
}

export default App
