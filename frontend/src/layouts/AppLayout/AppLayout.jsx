import { Outlet } from 'react-router-dom'
import Header from '../../components/Header/Header'
import Sidebar from '../../components/Sidebar/Sidebar'
import './AppLayout.css'

function AppLayout() {
  return (
    <div className="app-layout" data-cy="app-layout">
      <Sidebar />
      <div className="app-layout__conteudo">
        <Header />
        <main className="app-layout__principal">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AppLayout
