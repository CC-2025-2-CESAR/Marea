import { MotionConfig } from 'motion/react'
import { AuthProvider } from './contexts/AuthContext'
import AppRoutes from './routes/AppRoutes'

function App() {
  return (
    <MotionConfig reducedMotion="user">
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </MotionConfig>
  )
}

export default App
