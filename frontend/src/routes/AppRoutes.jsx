import { BrowserRouter, Route, Routes } from 'react-router-dom'
import AuthLayout from '../layouts/AuthLayout/AuthLayout'
import AppLayout from '../layouts/AppLayout/AppLayout'
import ProtectedRoute from '../components/ProtectedRoute/ProtectedRoute'
import Login from '../pages/Login/Login'
import Ativacao from '../pages/Ativacao/Ativacao'
import Recuperacao from '../pages/Recuperacao/Recuperacao'
import Redefinicao from '../pages/Redefinicao/Redefinicao'
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
import GestaoHome from '../pages/Gestao/GestaoHome'
import GestaoDicionario from '../pages/Gestao/GestaoDicionario'
import GestaoLogs from '../pages/Gestao/GestaoLogs'

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          {/* Primeiro acesso por convite: rota pública — a paciente ainda não
              tem sessão. Define a senha e já entra. */}
          <Route path="/ativar/:token" element={<Ativacao />} />
          {/* Recuperação de senha: rotas públicas (a pessoa esqueceu a senha). */}
          <Route path="/recuperar" element={<Recuperacao />} />
          <Route path="/redefinir/:token" element={<Redefinicao />} />
        </Route>

        {/* Tudo autenticado compartilha o mesmo shell (uma única instância de
            AppLayout — não remonta ao trocar de seção). Os sub-grupos abaixo só
            controlam o acesso por papel; a Sidebar mostra a navegação do papel. */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          {/* Conteúdo institucional da clínica: qualquer usuária autenticada
              (paciente ou médica). Endpoints públicos (AllowAny). */}
          <Route path="/dicionario" element={<Dicionario />} />
          <Route path="/dicionario/:id" element={<TermoDetalhe />} />
          <Route path="/tratamentos" element={<Tratamentos />} />
          <Route path="/tratamentos/:id" element={<TratamentoDetalhe />} />
          <Route path="/orientacoes" element={<Orientacoes />} />
          <Route path="/orientacoes/:id" element={<OrientacaoDetalhe />} />
          <Route path="/especialidades" element={<Especialidades />} />
          <Route
            path="/especialidades/:id"
            element={<EspecialidadeDetalhe />}
          />
          <Route path="/apoio" element={<ApoioEmocional />} />
          <Route path="/bot" element={<Bot />} />
          <Route path="/busca" element={<Busca />} />

          {/* Área da médica. */}
          <Route element={<ProtectedRoute papel="medica" />}>
            <Route path="/area-medica" element={<AreaMedica />} />
          </Route>

          {/* Painel administrativo da clínica. Vive em /gestao porque /admin
              pertence ao Django admin (e ao catch-all do SPA). */}
          <Route element={<ProtectedRoute papel="admin" />}>
            <Route path="/gestao" element={<GestaoHome />} />
            <Route path="/gestao/dicionario" element={<GestaoDicionario />} />
            <Route path="/gestao/logs" element={<GestaoLogs />} />
          </Route>

          {/* Área da paciente (dados pessoais): todas menos médica e
              administradora, que têm as próprias áreas. */}
          <Route element={<ProtectedRoute excetoPapel={['medica', 'admin']} />}>
            <Route index element={<Home />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/calendario" element={<Consultas />} />
            <Route path="/ciclo" element={<Ciclo />} />
            <Route path="/medicamentos" element={<Medicamentos />} />
            <Route path="/medicamentos/:id" element={<MedicamentoDetalhe />} />
            <Route path="/linha-do-tempo" element={<LinhaDoTempo />} />
            <Route path="/sintomas" element={<Sintomas />} />
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
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default AppRoutes
