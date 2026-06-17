// LGPD na interface: pagina publica de Privacidade + area "Meus dados" (ver,
// baixar, solicitar correcao/exclusao). As chamadas a /api/privacidade/ sao
// mockadas. O backend e a barreira real; aqui validamos o fluxo da interface.

const SESSAO_PACIENTE = {
  access: 'token-de-acesso-fake',
  refresh: 'token-de-refresh-fake',
  usuario: {
    id: 1,
    username: 'renata',
    email: 'renata@amare.test',
    tipo_usuario: 'paciente',
    nome_completo: 'Renata Cegonha',
  },
}

const MEUS_DADOS = {
  conta: {
    usuario: 'renata',
    email: 'renata@amare.test',
    membro_desde: '2025-01-10T00:00:00Z',
    ultimo_acesso: '2026-06-17T10:00:00Z',
  },
  perfil: {
    nome_completo: 'Renata Cegonha',
    tipo_usuario: 'paciente',
    tipo_usuario_display: 'Paciente',
    telefone: '(81) 90000-0000',
    criado_em: '2025-01-10T00:00:00Z',
    atualizado_em: '2026-06-01T00:00:00Z',
  },
  paciente: {
    data_nascimento: '1990-05-20',
    tipo_sanguineo: 'O+',
    tipo_sanguineo_display: 'O+',
    medicamentos_em_uso: '',
    observacoes_medicas: '',
    medica_responsavel: 'Dra. Helena Costa',
  },
  resumo_registros: [
    { area: 'Ciclo menstrual', rota: '/ciclo', quantidade: 3 },
    { area: 'Sintomas', rota: '/sintomas', quantidade: 1 },
  ],
  gerado_em: '2026-06-17T12:00:00Z',
}

const SOLICITACAO_CRIADA = {
  id: 10,
  tipo: 'exclusao',
  tipo_display: 'Exclusão / anonimização',
  mensagem: 'Quero remover meus dados.',
  status: 'pendente',
  status_display: 'Pendente',
  resposta: '',
  criada_em: '2026-06-17T12:30:00Z',
  atualizada_em: '2026-06-17T12:30:00Z',
}

function visitarComo(sessao, rota, onBeforeLoad) {
  return cy.visit(rota, {
    onBeforeLoad(janela) {
      janela.localStorage.setItem('marea_auth', JSON.stringify(sessao))
      if (onBeforeLoad) onBeforeLoad(janela)
    },
  })
}

describe('Privacidade e Meus dados (LGPD)', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    cy.intercept('GET', '**/api/privacidade/meus-dados/', {
      body: MEUS_DADOS,
    }).as('meusDados')
    cy.intercept('GET', '**/api/privacidade/solicitacoes/', { body: [] }).as(
      'solic',
    )
  })

  it('mostra a politica de privacidade sem exigir login', () => {
    cy.visit('/privacidade')

    cy.location('pathname').should('eq', '/privacidade')
    cy.get('[data-cy=page-privacidade]').should('be.visible')
    cy.contains('h1', 'Política de privacidade').should('be.visible')
    cy.get('[data-cy=privacidade-direitos]').should('be.visible')
    cy.get('[data-cy=privacidade-ir-meus-dados]').should(
      'have.attr',
      'href',
      '/meus-dados',
    )
  })

  it('exige login para acessar Meus dados', () => {
    cy.visit('/meus-dados')
    cy.location('pathname').should('eq', '/login')
  })

  it('mostra os dados consolidados da paciente e o link no rodape', () => {
    visitarComo(SESSAO_PACIENTE, '/meus-dados')
    cy.wait('@meusDados')

    cy.get('[data-cy=page-meus-dados]').should('be.visible')
    cy.get('[data-cy=meus-dados-conteudo]').should('contain', 'renata')
    cy.get('[data-cy=meus-dados-conteudo]').should('contain', 'Renata Cegonha')
    cy.get('[data-cy=meus-dados-resumo]').should('contain', 'Ciclo menstrual')
    cy.get('[data-cy=solicitacao-vazio]').should('be.visible')

    // Navegacao por papel e link da politica no rodape.
    cy.get('[data-cy=nav-meus-dados]').should(
      'have.attr',
      'href',
      '/meus-dados',
    )
    cy.get('[data-cy=rodape-privacidade]').should(
      'have.attr',
      'href',
      '/privacidade',
    )
  })

  it('baixa uma copia dos dados em JSON', () => {
    visitarComo(SESSAO_PACIENTE, '/meus-dados', (janela) => {
      cy.stub(janela.URL, 'createObjectURL').as('criarUrl').returns('blob:fake')
      cy.stub(janela.URL, 'revokeObjectURL').as('revogarUrl')
    })
    cy.wait('@meusDados')

    cy.get('[data-cy=meus-dados-baixar]').should('not.be.disabled').click()
    cy.get('@criarUrl').should('have.been.called')
  })

  it('abre uma solicitacao e ela aparece na lista', () => {
    let criou = false
    // FLAG no POST (nao contagem de GET): o StrictMode monta 2x e quebraria um
    // intercept baseado em contar chamadas.
    cy.intercept('GET', '**/api/privacidade/solicitacoes/', (req) => {
      req.reply({ body: criou ? [SOLICITACAO_CRIADA] : [] })
    }).as('listar')
    cy.intercept('POST', '**/api/privacidade/solicitacoes/', (req) => {
      criou = true
      req.reply({ statusCode: 201, body: SOLICITACAO_CRIADA })
    }).as('criar')

    visitarComo(SESSAO_PACIENTE, '/meus-dados')
    cy.get('[data-cy=solicitacao-vazio]').should('be.visible')

    // Escolhe o tipo "exclusao" no SelectField.
    cy.get('[data-cy=solicitacao-tipo]').click()
    cy.get('[data-cy=solicitacao-tipo-opcao-exclusao]').click()

    cy.get('[data-cy=solicitacao-mensagem]').type('Quero remover meus dados.')
    cy.get('[data-cy=solicitacao-enviar]').click()

    cy.wait('@criar')
    cy.get('[data-cy=meus-dados-feedback]').should('contain', 'enviada')
    cy.get('[data-cy=solicitacao-lista]').should('be.visible')
    cy.get('[data-cy=solicitacao-item-10]').should(
      'contain',
      'Quero remover meus dados.',
    )
  })

  it('valida solicitacao com mensagem vazia', () => {
    visitarComo(SESSAO_PACIENTE, '/meus-dados')
    cy.get('[data-cy=solicitacao-enviar]').click()
    cy.get('[data-cy=meus-dados-feedback]').should('contain', 'Descreva')
  })
})
