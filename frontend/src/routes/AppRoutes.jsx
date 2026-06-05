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
import Medicamentos from '../pages/Medicamentos/Medicamentos'
import Bot from '../pages/Bot/Bot'
import Tratamentos from '../pages/Tratamentos/Tratamentos'
import Orientacoes from '../pages/Orientacoes/Orientacoes'
import Especialidades from '../pages/Especialidades/Especialidades'
import LinhaDoTempo from '../pages/LinhaDoTempo/LinhaDoTempo'
import ApoioEmocional from '../pages/ApoioEmocional/ApoioEmocional'
import EmBreve from '../pages/EmBreve/EmBreve'
import AreaMedica from '../pages/AreaMedica/AreaMedica'

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
        </Route>

        {/* Área da médica (em construção): exclusiva do papel "medica". */}
        <Route
          path="/area-medica"
          element={
            <ProtectedRoute papel="medica">
              <AreaMedica />
            </ProtectedRoute>
          }
        />

        {/* Área da paciente: qualquer usuária autenticada, menos a médica
            (que tem a própria área). */}
        <Route
          element={
            <ProtectedRoute excetoPapel="medica">
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Home />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/calendario" element={<Consultas />} />
          <Route path="/ciclo" element={<Ciclo />} />
          <Route path="/dicionario" element={<Dicionario />} />
          <Route path="/medicamentos" element={<Medicamentos />} />
          <Route path="/bot" element={<Bot />} />
          <Route path="/tratamentos" element={<Tratamentos />} />
          <Route path="/orientacoes" element={<Orientacoes />} />
          <Route path="/especialidades" element={<Especialidades />} />
          <Route path="/linha-do-tempo" element={<LinhaDoTempo />} />
          <Route path="/apoio" element={<ApoioEmocional />} />
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
