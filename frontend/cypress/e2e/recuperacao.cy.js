// Recuperação de senha: telas públicas /recuperar e /redefinir/:token. As
// chamadas à API são mockadas com cy.intercept.

describe('Recuperação de senha', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
  })

  // --- /recuperar ---
  it('envia o pedido e mostra a mensagem genérica', () => {
    cy.intercept('POST', '**/api/auth/recuperar/', {
      statusCode: 200,
      body: {
        detail:
          'Se houver uma conta com esse e-mail, enviamos um link para redefinir a senha.',
      },
    }).as('recuperar')

    cy.visit('/recuperar')
    cy.get('[data-cy=page-recuperacao]').should('be.visible')
    cy.get('[data-cy=auth-layout]').should('be.visible')
    cy.get('[data-cy=app-sidebar]').should('not.exist')

    cy.get('[data-cy=recuperacao-email]').type('ana@amare.test')
    cy.get('[data-cy=recuperacao-submit]').click()
    cy.wait('@recuperar')
    cy.get('[data-cy=recuperacao-sucesso]').should('be.visible')
  })

  it('valida e-mail vazio sem chamar a API', () => {
    cy.visit('/recuperar')
    cy.get('[data-cy=recuperacao-submit]').click()
    cy.get('[data-cy=recuperacao-feedback]').should(
      'contain',
      'Informe o seu e-mail',
    )
    cy.get('[data-cy=recuperacao-sucesso]').should('not.exist')
  })

  it('o link "Esqueceu a senha?" do login leva para /recuperar', () => {
    cy.visit('/login')
    cy.get('[data-cy=login-forgot]').click()
    cy.location('pathname').should('eq', '/recuperar')
    cy.get('[data-cy=page-recuperacao]').should('be.visible')
  })

  // --- /redefinir/:token ---
  it('mostra o formulário quando o link é válido', () => {
    cy.intercept('GET', '**/api/auth/redefinir/tok-ok/', {
      statusCode: 200,
      body: { valido: true, status: 'pendente' },
    }).as('validar')

    cy.visit('/redefinir/tok-ok')
    cy.wait('@validar')
    cy.get('[data-cy=page-redefinicao]').should('be.visible')
    cy.get('[data-cy=redefinicao-senha]').should('be.visible')
    cy.get('[data-cy=redefinicao-submit]').should('be.visible')
  })

  it('recusa quando as senhas não coincidem (sem chamar a API)', () => {
    cy.intercept('GET', '**/api/auth/redefinir/tok-ok/', {
      body: { valido: true, status: 'pendente' },
    })
    cy.visit('/redefinir/tok-ok')
    cy.get('[data-cy=redefinicao-senha]').type('Bromelia#2024')
    cy.get('[data-cy=redefinicao-confirmar]').type('Bromelia#2025')
    cy.get('[data-cy=redefinicao-submit]').click()
    cy.get('[data-cy=redefinicao-feedback]').should('contain', 'não coincidem')
  })

  it('redefine a senha e oferece ir para o login', () => {
    cy.intercept('GET', '**/api/auth/redefinir/tok-ok/', {
      body: { valido: true, status: 'pendente' },
    })
    cy.intercept('POST', '**/api/auth/redefinir/tok-ok/', {
      statusCode: 200,
      body: { detail: 'Senha redefinida. Agora é só entrar com a sua nova senha.' },
    }).as('redefinir')

    cy.visit('/redefinir/tok-ok')
    cy.get('[data-cy=redefinicao-senha]').type('Bromelia#2024')
    cy.get('[data-cy=redefinicao-confirmar]').type('Bromelia#2024')
    cy.get('[data-cy=redefinicao-submit]').click()
    cy.wait('@redefinir')
    cy.get('[data-cy=redefinicao-sucesso]').should('be.visible')
    cy.get('[data-cy=redefinicao-ir-login]').should('have.attr', 'href', '/login')
  })

  it('mostra a mensagem de senha fraca vinda do backend', () => {
    cy.intercept('GET', '**/api/auth/redefinir/tok-ok/', {
      body: { valido: true, status: 'pendente' },
    })
    cy.intercept('POST', '**/api/auth/redefinir/tok-ok/', {
      statusCode: 400,
      body: { password: ['Esta senha é muito comum.'] },
    }).as('redefinir')

    cy.visit('/redefinir/tok-ok')
    cy.get('[data-cy=redefinicao-senha]').type('123456')
    cy.get('[data-cy=redefinicao-confirmar]').type('123456')
    cy.get('[data-cy=redefinicao-submit]').click()
    cy.wait('@redefinir')
    cy.get('[data-cy=redefinicao-feedback]').should('contain', 'muito comum')
  })

  it('mostra o estado de link expirado', () => {
    cy.intercept('GET', '**/api/auth/redefinir/tok-exp/', {
      body: { valido: false, status: 'expirado' },
    })
    cy.visit('/redefinir/tok-exp')
    cy.get('[data-cy=redefinicao-invalido]')
      .should('be.visible')
      .and('contain', 'expirou')
    cy.get('[data-cy=redefinicao-senha]').should('not.exist')
    cy.get('[data-cy=redefinicao-ir-recuperar]').should(
      'have.attr',
      'href',
      '/recuperar',
    )
  })

  it('mostra o estado de link não encontrado (404)', () => {
    cy.intercept('GET', '**/api/auth/redefinir/tok-x/', {
      statusCode: 404,
      body: { detail: 'Link de redefinição não encontrado.' },
    })
    cy.visit('/redefinir/tok-x')
    cy.get('[data-cy=redefinicao-invalido]')
      .should('be.visible')
      .and('contain', 'não encontrado')
  })

  it('renderiza bem em viewport mobile', () => {
    cy.viewport(375, 700)
    cy.intercept('GET', '**/api/auth/redefinir/tok-ok/', {
      body: { valido: true, status: 'pendente' },
    })
    cy.visit('/redefinir/tok-ok')
    cy.get('[data-cy=page-redefinicao]').should('be.visible')
    cy.get('[data-cy=redefinicao-submit]').should('be.visible')
    cy.document().then((doc) => {
      const raiz = doc.documentElement
      expect(raiz.scrollWidth).to.be.at.most(raiz.clientWidth + 2)
    })
  })
})
