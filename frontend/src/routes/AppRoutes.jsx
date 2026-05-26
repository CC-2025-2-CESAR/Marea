import { BrowserRouter, Route, Routes } from 'react-router-dom'
import AuthLayout from '../layouts/AuthLayout/AuthLayout'
import AppLayout from '../layouts/AppLayout/AppLayout'
import ProtectedRoute from '../components/ProtectedRoute/ProtectedRoute'
import Login from '../pages/Login/Login'
import Home from '../pages/Home/Home'
import Perfil from '../pages/Perfil/Perfil'
import Consultas from '../pages/Consultas/Consultas'
import Ciclo from '../pages/Ciclo/Ciclo'
import Dicionario from '../pages/Dicionario/Dicionario'
import Bot from '../pages/Bot/Bot'
import Tratamentos from '../pages/Tratamentos/Tratamentos'
import Especialidades from '../pages/Especialidades/Especialidades'
import EmBreve from '../pages/EmBreve/EmBreve'

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
        </Route>

        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Home />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/calendario" element={<Consultas />} />
          <Route path="/ciclo" element={<Ciclo />} />
          <Route path="/dicionario" element={<Dicionario />} />
          <Route path="/bot" element={<Bot />} />
          <Route path="/tratamentos" element={<Tratamentos />} />
          <Route path="/especialidades" element={<Especialidades />} />
          <Route
            path="*"
            element={
              <EmBreve
                titulo="Página não encontrada"
                descricao="Esta página será desenvolvida em uma próxima etapa."
              />
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default AppRoutes
