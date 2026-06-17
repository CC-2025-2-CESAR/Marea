// Primeiro acesso por convite (/ativar/:token): rota pública onde a paciente
// valida o convite e define a própria senha. As chamadas à API são mockadas.

const CONVITE_VALIDO = {
  valido: true,
  status: 'pendente',
  nome: 'Aurora Lima',
  email: 'aurora@amare.test',
}

const SESSAO_ATIVADA = {
  access: 'token-de-acesso-fake',
  refresh: 'token-de-refresh-fake',
  usuario: {
    id: 9,
    username: 'aurora-lima',
    email: 'aurora@amare.test',
    tipo_usuario: 'paciente',
    nome_completo: 'Aurora Lima',
  },
}

describe('Primeiro acesso por convite (/ativar/:token)', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
  })

  it('mostra o formulário quando o convite é válido', () => {
    cy.intercept('GET', '**/api/convite/tok-ok/', {
      statusCode: 200,
      body: CONVITE_VALIDO,
    }).as('detalhe')

    cy.visit('/ativar/tok-ok')
    cy.wait('@detalhe')

    cy.get('[data-cy=page-ativacao]').should('be.visible')
    cy.get('[data-cy=auth-layout]').should('be.visible')
    cy.get('[data-cy=app-sidebar]').should('not.exist')
    cy.get('[data-cy=ativacao-nome]').should('contain', 'Aurora Lima')
    cy.get('[data-cy=ativacao-senha]').should('be.visible')
    cy.get('[data-cy=ativacao-submit]').should('be.visible')
  })

  it('alterna a visibilidade da senha', () => {
    cy.intercept('GET', '**/api/convite/tok-ok/', { body: CONVITE_VALIDO })
    cy.visit('/ativar/tok-ok')

    cy.get('[data-cy=ativacao-senha]').should('have.attr', 'type', 'password')
    cy.get('[data-cy=ativacao-toggle-password]').click()
    cy.get('[data-cy=ativacao-senha]').should('have.attr', 'type', 'text')
  })

  it('recusa quando as senhas não coincidem (sem chamar a API)', () => {
    cy.intercept('GET', '**/api/convite/tok-ok/', { body: CONVITE_VALIDO })
    cy.visit('/ativar/tok-ok')

    cy.get('[data-cy=ativacao-senha]').type('Girassol#2024')
    cy.get('[data-cy=ativacao-confirmar]').type('Girassol#2025')
    cy.get('[data-cy=ativacao-submit]').click()

    cy.get('[data-cy=ativacao-feedback]').should('contain', 'não coincidem')
    cy.location('pathname').should('eq', '/ativar/tok-ok')
  })

  it('define a senha, autentica e leva ao perfil', () => {
    cy.intercept('GET', '**/api/convite/tok-ok/', { body: CONVITE_VALIDO })
    cy.intercept('POST', '**/api/convite/tok-ok/definir-senha/', {
      statusCode: 200,
      body: SESSAO_ATIVADA,
    }).as('definir')
    cy.intercept('GET', '**/api/perfil/', {
      body: {
        username: 'aurora-lima',
        email: 'aurora@amare.test',
        tipo_usuario: 'paciente',
        nome_completo: 'Aurora Lima',
        telefone: '',
        foto_url: '',
        data_nascimento: null,
        tipo_sanguineo: '',
        medicamentos_em_uso: '',
        observacoes_medicas: '',
      },
    })

    cy.visit('/ativar/tok-ok')
    cy.get('[data-cy=ativacao-senha]').type('Girassol#2024')
    cy.get('[data-cy=ativacao-confirmar]').type('Girassol#2024')
    cy.get('[data-cy=ativacao-submit]').click()

    cy.wait('@definir')
    cy.location('pathname').should('eq', '/perfil')
    cy.window().its('localStorage.marea_auth').should('contain', 'aurora-lima')
  })

  it('mostra a mensagem de senha fraca vinda do backend', () => {
    cy.intercept('GET', '**/api/convite/tok-ok/', { body: CONVITE_VALIDO })
    cy.intercept('POST', '**/api/convite/tok-ok/definir-senha/', {
      statusCode: 400,
      body: { password: ['Esta senha é muito comum.'] },
    }).as('definir')

    cy.visit('/ativar/tok-ok')
    cy.get('[data-cy=ativacao-senha]').type('123456')
    cy.get('[data-cy=ativacao-confirmar]').type('123456')
    cy.get('[data-cy=ativacao-submit]').click()

    cy.wait('@definir')
    cy.get('[data-cy=ativacao-feedback]').should('contain', 'muito comum')
    cy.location('pathname').should('eq', '/ativar/tok-ok')
  })

  it('mostra o estado de convite expirado', () => {
    cy.intercept('GET', '**/api/convite/tok-exp/', {
      body: { valido: false, status: 'expirado', nome: 'Aurora', email: 'a@amare.test' },
    })

    cy.visit('/ativar/tok-exp')
    cy.get('[data-cy=ativacao-invalido]')
      .should('be.visible')
      .and('contain', 'expirou')
    cy.get('[data-cy=ativacao-senha]').should('not.exist')
    cy.get('[data-cy=ativacao-ir-login]').should('have.attr', 'href', '/login')
  })

  it('mostra o estado de convite não encontrado (404)', () => {
    cy.intercept('GET', '**/api/convite/tok-x/', {
      statusCode: 404,
      body: { detail: 'Convite não encontrado.' },
    })

    cy.visit('/ativar/tok-x')
    cy.get('[data-cy=ativacao-invalido]')
      .should('be.visible')
      .and('contain', 'não encontrado')
  })

  it('renderiza bem em viewport mobile', () => {
    cy.viewport(375, 700)
    cy.intercept('GET', '**/api/convite/tok-ok/', { body: CONVITE_VALIDO })

    cy.visit('/ativar/tok-ok')
    cy.get('[data-cy=page-ativacao]').should('be.visible')
    cy.get('[data-cy=ativacao-submit]').should('be.visible')
    // Sem rolagem horizontal (requisito mobile-first).
    cy.document().then((doc) => {
      const raiz = doc.documentElement
      expect(raiz.scrollWidth).to.be.at.most(raiz.clientWidth + 2)
    })
  })
})
