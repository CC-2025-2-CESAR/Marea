import { Link } from 'react-router-dom'
import './Privacidade.css'

/**
 * Política de privacidade da Amare — página pública (acessível antes do login),
 * em linguagem simples. Espelha docs/lgpd/politica-privacidade.md. Os direitos
 * do titular (acesso, correção, exclusão) são exercidos na área "Meus dados".
 */
function Privacidade() {
  return (
    <main className="privacidade" data-cy="page-privacidade">
      <article className="privacidade__conteudo">
        <header className="privacidade__cabecalho">
          <Link
            to="/"
            className="privacidade__voltar"
            data-cy="privacidade-voltar"
          >
            ← Voltar
          </Link>
          <h1>Política de privacidade</h1>
          <p className="privacidade__intro">
            A Amare apoia pacientes em tratamento de fertilidade da Clínica
            Amare. Tratamos seus dados com cuidado porque eles envolvem saúde e
            momentos delicados.
          </p>
        </header>

        <section className="privacidade__secao">
          <h2>Quais dados coletamos</h2>
          <ul>
            <li>
              <strong>Conta:</strong> nome, e-mail e senha.
            </li>
            <li>
              <strong>Perfil:</strong> telefone, data de nascimento e tipo
              sanguíneo.
            </li>
            <li>
              <strong>Tratamento:</strong> medicamentos, consultas, ciclo,
              sintomas e observações do seu acompanhamento.
            </li>
          </ul>
          <p>
            Coletamos apenas o necessário para o serviço e o apoio ao seu
            tratamento.
          </p>
        </section>

        <section className="privacidade__secao">
          <h2>Para que usamos</h2>
          <ul>
            <li>Identificar e proteger a sua conta.</li>
            <li>Organizar consultas, medicações e orientações do tratamento.</li>
            <li>Permitir que a médica responsável acompanhe o seu cuidado.</li>
          </ul>
          <p>Não vendemos os seus dados nem os usamos para publicidade.</p>
        </section>

        <section className="privacidade__secao">
          <h2>Quem pode ver</h2>
          <ul>
            <li>
              <strong>Você</strong>, sempre que quiser.
            </li>
            <li>
              <strong>A médica vinculada a você</strong>, para acompanhar o
              tratamento.
            </li>
            <li>
              <strong>A administração</strong>, apenas para manter a plataforma
              funcionando.
            </li>
          </ul>
          <p>Seus dados clínicos não ficam visíveis para outras pacientes.</p>
        </section>

        <section className="privacidade__secao">
          <h2>Como protegemos</h2>
          <ul>
            <li>Senha guardada de forma cifrada (nunca em texto puro).</li>
            <li>Conexão segura (HTTPS) em produção.</li>
            <li>Controle de acesso: cada pessoa só vê o que lhe compete.</li>
            <li>
              Dados sensíveis nunca aparecem em endereços de página nem em
              registros técnicos.
            </li>
          </ul>
        </section>

        <section
          className="privacidade__secao privacidade__secao--destaque"
          data-cy="privacidade-direitos"
        >
          <h2>Seus direitos (LGPD)</h2>
          <p>
            Você pode acessar, baixar, pedir correção ou solicitar a exclusão
            dos seus dados. Na sua conta, a área <strong>Meus dados</strong>
            {' '}reúne tudo isso em um só lugar.
          </p>
          <Link
            to="/meus-dados"
            className="privacidade__cta"
            data-cy="privacidade-ir-meus-dados"
          >
            Ir para Meus dados
          </Link>
        </section>

        <section className="privacidade__secao">
          <h2>Cookies e armazenamento</h2>
          <p>
            Usamos o armazenamento do navegador apenas para manter você
            conectada (sessão). Não usamos rastreadores de publicidade.
          </p>
        </section>

        <section className="privacidade__secao">
          <h2>Contato</h2>
          <p>
            Dúvidas sobre privacidade podem ser enviadas à Clínica Amare pelos
            canais de atendimento.
          </p>
        </section>

        <p className="privacidade__rodape-aviso">
          Protótipo acadêmico. Esta política é um rascunho e não substitui
          orientação jurídica.
        </p>
      </article>
    </main>
  )
}

export default Privacidade
