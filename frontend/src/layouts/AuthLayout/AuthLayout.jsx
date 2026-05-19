import { Outlet } from 'react-router-dom'
import './AuthLayout.css'

function AuthLayout() {
  return (
    <div className="auth-layout" data-cy="auth-layout">
      <Outlet />
    </div>
  )
}

export default AuthLayout
