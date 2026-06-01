/**
 * Área da médica — placeholder.
 *
 * Esta é a "casa" das usuárias com papel de médica. Por enquanto é uma tela
 * de boas-vindas em construção: a área completa (lista de pacientes
 * vinculadas, detalhes, agenda, medicamentos) chega em uma próxima etapa.
 *
 * É uma tela autônoma — não usa o AppLayout/sidebar da paciente, porque a
 * navegação da médica será diferente. Inclui apenas um botão Sair.
 */

import { useNavigate } from 'react-router-dom'
import logoAmare from '../../assets/amare-logo.png'
import { useAuth } from '../../contexts/useAuth'
import './AreaMedica.css'

function AreaMedica() {
  const { usuario, logout } = useAuth()
  const navegar = useNavigate()

  function handleSair() {
    logout()
    navegar('/login', { replace: true })
  }

  const nome = usuario?.nome_completo?.trim() || 'médica'

  return (
    <main className="area-medica" data-cy="page-area-medica">
      <section className="area-medica__cartao">
        <img src={logoAmare} alt="Amare" className="area-medica__logo" />
        <h1 className="area-medica__titulo">Área da médica</h1>
        <p className="area-medica__saudacao">Olá, {nome}.</p>
        <p className="area-medica__texto">
          Esta área é exclusiva da equipe médica e está em construção. Em breve
          você poderá acompanhar suas pacientes, agendar consultas e registrar
          medicamentos e observações do tratamento.
        </p>
        <button
          type="button"
          className="area-medica__sair"
          onClick={handleSair}
          data-cy="area-medica-logout"
        >
          Sair
        </button>
      </section>
    </main>
  )
}

export default AreaMedica
