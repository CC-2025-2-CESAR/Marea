describe('Tela de login da Amare', () => {
  beforeEach(() => {
    // Garante que cada teste comeca sem sessao salva.
    cy.clearLocalStorage()
    cy.visit('/login')
  })

  it('carrega a página de login corretamente', () => {
    cy.get('.login-card').should('be.visible')
  })

  it('exibe o logo da Amare', () => {
    cy.get('[data-cy=amare-logo]').should('be.visible')
  })

  it('exibe o campo de usuário/e-mail', () => {
    cy.get('[data-cy=login-username]').should('be.visible')
  })

  it('exibe o campo de senha', () => {
    cy.get('[data-cy=login-password]').should('be.visible')
  })

  it('exibe o botão de login', () => {
    cy.get('[data-cy=login-submit]')
      .should('be.visible')
      .and('contain', 'Entrar')
  })

  it('mostra mensagem de erro ao enviar com campos vazios', () => {
    cy.get('[data-cy=login-feedback]').should('not.exist')
    cy.get('[data-cy=login-submit]').click()
    cy.get('[data-cy=login-feedback]')
      .should('be.visible')
      .and('contain', 'Preencha usuário/e-mail e senha para continuar.')
  })

  it('alterna o tipo do campo de senha ao clicar no ícone', () => {
    cy.get('[data-cy=login-password]').should('have.attr', 'type', 'password')
    cy.get('[data-cy=login-toggle-password]').click()
    cy.get('[data-cy=login-password]').should('have.attr', 'type', 'text')
    cy.get('[data-cy=login-toggle-password]').click()
    cy.get('[data-cy=login-password]').should('have.attr', 'type', 'password')
  })

  it('redireciona para /perfil quando o login da API retorna sucesso', () => {
    cy.intercept('POST', '**/api/auth/login/', {
      statusCode: 200,
      body: {
        access: 'token-de-acesso-fake',
        refresh: 'token-de-refresh-fake',
        usuario: {
          id: 1,
          username: 'paciente_teste',
          email: 'paciente@amare.test',
          tipo_usuario: 'paciente',
          nome_completo: 'Júlia Pereira',
        },
      },
    }).as('login')
    // O Perfil carrega via GET /api/perfil/ assim que /perfil monta.
    cy.intercept('GET', '**/api/perfil/', {
      statusCode: 200,
      body: {
        username: 'paciente_teste',
        email: 'paciente@amare.test',
        tipo_usuario: 'paciente',
        nome_completo: 'Júlia Pereira',
        telefone: '(81) 91234-5678',
        foto_url: '',
        data_nascimento: '1993-04-12',
        tipo_sanguineo: 'O+',
        medicamentos_em_uso: '',
        observacoes_medicas: '',
      },
    }).as('perfil')

    cy.get('[data-cy=login-username]').type('paciente_teste')
    cy.get('[data-cy=login-password]').type('amare123')
    cy.get('[data-cy=login-submit]').click()

    cy.wait('@login')
    cy.location('pathname').should('eq', '/perfil')
  })

  it('mostra mensagem amigável quando a API responde 401', () => {
    cy.intercept('POST', '**/api/auth/login/', {
      statusCode: 401,
      body: { detail: 'Usuário ou senha inválidos.' },
    }).as('login')

    cy.get('[data-cy=login-username]').type('paciente_teste')
    cy.get('[data-cy=login-password]').type('senha-errada')
    cy.get('[data-cy=login-submit]').click()

    cy.wait('@login')
    cy.get('[data-cy=login-feedback]')
      .should('be.visible')
      .and('contain', 'Usuário ou senha inválidos.')
    cy.location('pathname').should('eq', '/login')
  })

  it('mostra mensagem genérica quando o backend está indisponível', () => {
    cy.intercept('POST', '**/api/auth/login/', { forceNetworkError: true }).as(
      'login',
    )

    cy.get('[data-cy=login-username]').type('paciente_teste')
    cy.get('[data-cy=login-password]').type('amare123')
    cy.get('[data-cy=login-submit]').click()

    cy.wait('@login')
    cy.get('[data-cy=login-feedback]')
      .should('be.visible')
      .and(
        'contain',
        'Não foi possível entrar agora. Verifique sua conexão e tente novamente.',
      )
  })
})
