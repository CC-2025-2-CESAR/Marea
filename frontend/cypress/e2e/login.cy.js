describe('Tela de login da Amare', () => {
  beforeEach(() => {
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

  it('mostra sucesso simulado ao preencher e enviar', () => {
    cy.get('[data-cy=login-username]').type('paciente@exemplo.com')
    cy.get('[data-cy=login-password]').type('minhasenha123')
    cy.get('[data-cy=login-submit]').click()
    cy.get('[data-cy=login-feedback]')
      .should('be.visible')
      .and('contain', 'Login simulado com sucesso.')
  })
})
