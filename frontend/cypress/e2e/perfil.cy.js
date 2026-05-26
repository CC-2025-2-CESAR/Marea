const SESSAO_FAKE = {
  access: 'token-de-acesso-fake',
  refresh: 'token-de-refresh-fake',
  usuario: {
    id: 1,
    username: 'paciente_teste',
    email: 'paciente@amare.test',
    tipo_usuario: 'paciente',
    nome_completo: 'Júlia Pereira',
  },
}

const PERFIL_MOCK = {
  username: 'paciente_teste',
  email: 'paciente@amare.test',
  tipo_usuario: 'paciente',
  nome_completo: 'Júlia Pereira',
  telefone: '(81) 91234-5678',
  foto_url: '',
  data_nascimento: '1993-04-12',
  tipo_sanguineo: 'O+',
  medicamentos_em_uso: 'Ácido fólico 5mg, uma vez ao dia.',
  observacoes_medicas: 'Em acompanhamento para indução da ovulação.',
}

function visitarComSessao(rota = '/perfil') {
  cy.visit(rota, {
    onBeforeLoad(janela) {
      janela.localStorage.setItem('marea_auth', JSON.stringify(SESSAO_FAKE))
    },
  })
}

describe('Página de Perfil da Amare', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
  })

  it('redireciona para /login quando nao ha sessao salva', () => {
    cy.visit('/perfil')
    cy.location('pathname').should('eq', '/login')
  })

  it('exibe titulo e dados do perfil ao carregar', () => {
    cy.intercept('GET', '**/api/perfil/', { body: PERFIL_MOCK }).as('perfil')
    visitarComSessao()
    cy.wait('@perfil')

    cy.get('[data-cy=page-perfil]').should('be.visible')
    cy.contains('h1', 'Perfil').should('be.visible')
    cy.get('[data-cy=perfil-nome]').should('have.value', 'Júlia Pereira')
    cy.get('[data-cy=perfil-telefone]').should('have.value', '(81) 91234-5678')
    cy.get('[data-cy=perfil-data-nascimento]').should('have.value', '1993-04-12')
    cy.get('[data-cy=perfil-tipo-sanguineo]').should('contain', 'O+')
  })

  it('mostra o e-mail como leitura apenas', () => {
    cy.intercept('GET', '**/api/perfil/', { body: PERFIL_MOCK }).as('perfil')
    visitarComSessao()
    cy.wait('@perfil')

    cy.get('[data-cy=perfil-email]')
      .should('have.value', 'paciente@amare.test')
      .and('have.attr', 'readonly')
  })

  it('exibe medicamentos e observacoes como texto', () => {
    cy.intercept('GET', '**/api/perfil/', { body: PERFIL_MOCK }).as('perfil')
    visitarComSessao()
    cy.wait('@perfil')

    cy.get('[data-cy=perfil-medicamentos]').should(
      'contain',
      'Ácido fólico 5mg, uma vez ao dia.',
    )
    cy.get('[data-cy=perfil-observacoes]').should(
      'contain',
      'Em acompanhamento para indução da ovulação.',
    )
  })

  it('mantem os botoes secundarios desabilitados', () => {
    cy.intercept('GET', '**/api/perfil/', { body: PERFIL_MOCK }).as('perfil')
    visitarComSessao()
    cy.wait('@perfil')

    cy.get('[data-cy=perfil-botoes-secundarios] button').each(($botao) => {
      cy.wrap($botao).should('be.disabled')
    })
  })

  it('salva alteracoes do perfil e mostra mensagem de sucesso', () => {
    cy.intercept('GET', '**/api/perfil/', { body: PERFIL_MOCK }).as('perfil')
    cy.intercept('PATCH', '**/api/perfil/', (req) => {
      req.reply({
        statusCode: 200,
        body: { ...PERFIL_MOCK, telefone: '(81) 99999-1234' },
      })
    }).as('salvar')

    visitarComSessao()
    cy.wait('@perfil')

    cy.get('[data-cy=perfil-telefone]').clear().type('(81) 99999-1234')
    cy.get('[data-cy=perfil-salvar]').click()

    cy.wait('@salvar')
    cy.get('[data-cy=perfil-feedback]')
      .should('be.visible')
      .and('contain', 'Perfil atualizado com sucesso.')
  })

  it('exibe mensagem de erro quando a API falha ao salvar', () => {
    cy.intercept('GET', '**/api/perfil/', { body: PERFIL_MOCK }).as('perfil')
    cy.intercept('PATCH', '**/api/perfil/', { statusCode: 500, body: {} }).as(
      'salvar',
    )

    visitarComSessao()
    cy.wait('@perfil')

    cy.get('[data-cy=perfil-telefone]').clear().type('(81) 90000-0000')
    cy.get('[data-cy=perfil-salvar]').click()

    cy.wait('@salvar')
    cy.get('[data-cy=perfil-feedback]')
      .should('be.visible')
      .and('contain', 'Não foi possível salvar agora.')
  })

  it('mostra mensagem de erro quando o carregamento inicial falha', () => {
    cy.intercept('GET', '**/api/perfil/', { statusCode: 500, body: {} }).as(
      'perfil',
    )
    visitarComSessao()
    cy.wait('@perfil')

    cy.get('[data-cy=perfil-mensagem-erro]')
      .should('be.visible')
      .and('contain', 'Não foi possível carregar seu perfil no momento.')
  })

  it('o botao Sair limpa a sessao e volta para /login', () => {
    cy.intercept('GET', '**/api/perfil/', { body: PERFIL_MOCK }).as('perfil')
    visitarComSessao()
    cy.wait('@perfil')

    cy.get('[data-cy=nav-logout]').click()
    cy.location('pathname').should('eq', '/login')
    cy.window().its('localStorage.marea_auth').should('be.undefined')
  })
})
