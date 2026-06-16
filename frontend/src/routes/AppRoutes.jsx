import { BrowserRouter, Route, Routes } from 'react-router-dom'
import AuthLayout from '../layouts/AuthLayout/AuthLayout'
import AppLayout from '../layouts/AppLayout/AppLayout'
import ProtectedRoute from '../components/ProtectedRoute/ProtectedRoute'
import Login from '../pages/Login/Login'
import Ativacao from '../pages/Ativacao/Ativacao'
import Home from '../pages/Home/Home'
import Perfil from '../pages/Perfil/Perfil'
import Consultas from '../pages/Consultas/Consultas'
import Ciclo from '../pages/Ciclo/Ciclo'
import Dicionario from '../pages/Dicionario/Dicionario'
import TermoDetalhe from '../pages/Dicionario/TermoDetalhe'
import Medicamentos from '../pages/Medicamentos/Medicamentos'
import MedicamentoDetalhe from '../pages/Medicamentos/MedicamentoDetalhe'
import Bot from '../pages/Bot/Bot'
import Tratamentos from '../pages/Tratamentos/Tratamentos'
import TratamentoDetalhe from '../pages/Tratamentos/TratamentoDetalhe'
import Orientacoes from '../pages/Orientacoes/Orientacoes'
import OrientacaoDetalhe from '../pages/Orientacoes/OrientacaoDetalhe'
import Especialidades from '../pages/Especialidades/Especialidades'
import EspecialidadeDetalhe from '../pages/Especialidades/EspecialidadeDetalhe'
import LinhaDoTempo from '../pages/LinhaDoTempo/LinhaDoTempo'
import ApoioEmocional from '../pages/ApoioEmocional/ApoioEmocional'
import Sintomas from '../pages/Sintomas/Sintomas'
import Busca from '../pages/Busca/Busca'
import EmBreve from '../pages/EmBreve/EmBreve'
import AreaMedica from '../pages/AreaMedica/AreaMedica'

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          {/* Primeiro acesso por convite: rota pública — a paciente ainda não
              tem sessão. Define a senha e já entra. */}
          <Route path="/ativar/:token" element={<Ativacao />} />
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
          <Route path="/dicionario/:id" element={<TermoDetalhe />} />
          <Route path="/medicamentos" element={<Medicamentos />} />
          <Route path="/medicamentos/:id" element={<MedicamentoDetalhe />} />
          <Route path="/bot" element={<Bot />} />
          <Route path="/tratamentos" element={<Tratamentos />} />
          <Route path="/tratamentos/:id" element={<TratamentoDetalhe />} />
          <Route path="/orientacoes" element={<Orientacoes />} />
          <Route path="/orientacoes/:id" element={<OrientacaoDetalhe />} />
          <Route path="/especialidades" element={<Especialidades />} />
          <Route
            path="/especialidades/:id"
            element={<EspecialidadeDetalhe />}
          />
          <Route path="/linha-do-tempo" element={<LinhaDoTempo />} />
          <Route path="/apoio" element={<ApoioEmocional />} />
          <Route path="/sintomas" element={<Sintomas />} />
          <Route path="/busca" element={<Busca />} />
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
