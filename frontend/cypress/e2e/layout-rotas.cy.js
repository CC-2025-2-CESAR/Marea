describe('Rotas e layout base do Maréa', () => {
  // Páginas ainda em placeholder. Dicionário foi removido daqui porque agora
  // tem implementação real (ver dicionario.cy.js).
  const paginasPlaceholder = [
    { rota: '/perfil', titulo: 'Perfil', dataCy: 'nav-perfil' },
    { rota: '/calendario', titulo: 'Calendário', dataCy: 'nav-calendario' },
    { rota: '/ciclo', titulo: 'Ciclo', dataCy: 'nav-ciclo' },
    { rota: '/bot', titulo: 'Bot', dataCy: 'nav-bot' },
    { rota: '/tratamentos', titulo: 'Tratamentos', dataCy: 'nav-tratamentos' },
    {
      rota: '/especialidades',
      titulo: 'Especialidades',
      dataCy: 'nav-especialidades',
    },
  ]

  it('carrega a tela de login na rota /login sem sidebar', () => {
    cy.visit('/login')

    cy.get('[data-cy=auth-layout]').should('be.visible')
    cy.get('.login-card').should('be.visible')
    cy.get('[data-cy=app-sidebar]').should('not.exist')
    cy.get('[data-cy=app-header]').should('not.exist')
  })

  it('carrega a Home com sidebar, header e busca', () => {
    cy.visit('/')

    cy.get('[data-cy=app-layout]').should('be.visible')
    cy.get('[data-cy=home-page]').should('be.visible')
    cy.contains('h1', 'Bem-vinda ao Maréa').should('be.visible')
    cy.get('[data-cy=app-sidebar]').should('be.visible')
    cy.get('[data-cy=app-header]').should('be.visible')
    cy.get('[data-cy=app-search]').should('be.visible')
    cy.get('[data-cy=app-search] input').should(
      'have.attr',
      'placeholder',
      'Buscar no Maréa',
    )
  })

  it('navega pelos links da sidebar para as páginas corretas', () => {
    cy.visit('/')

    cy.get('[data-cy=nav-home]').should('have.attr', 'href', '/')
    cy.get('[data-cy=nav-home]').click()
    cy.location('pathname').should('eq', '/')
    cy.contains('h1', 'Bem-vinda ao Maréa').should('be.visible')

    paginasPlaceholder.forEach((pagina) => {
      cy.get(`[data-cy=${pagina.dataCy}]`).should(
        'have.attr',
        'href',
        pagina.rota,
      )
      cy.get(`[data-cy=${pagina.dataCy}]`).click()
      cy.location('pathname').should('eq', pagina.rota)
      cy.contains('h1', pagina.titulo).should('be.visible')
      cy.contains('Esta página será desenvolvida em uma próxima etapa.').should(
        'be.visible',
      )
    })

    // Dicionário é uma rota real (não placeholder); a navegação ainda funciona,
    // mas o conteúdo é a página de termos médicos.
    cy.intercept('GET', '**/api/dicionario/termos/**', { body: [] })
    cy.get('[data-cy=nav-dicionario]').should(
      'have.attr',
      'href',
      '/dicionario',
    )
    cy.get('[data-cy=nav-dicionario]').click()
    cy.location('pathname').should('eq', '/dicionario')
    cy.contains('h1', 'Dicionário').should('be.visible')
  })

  it('abre Calendário e Bot corretamente por rota direta', () => {
    const rotasDiretas = [
      { rota: '/calendario', titulo: 'Calendário' },
      { rota: '/bot', titulo: 'Bot' },
    ]

    rotasDiretas.forEach((pagina) => {
      cy.visit(pagina.rota)
      cy.get('[data-cy=app-layout]').should('be.visible')
      cy.get('[data-cy=app-search]').should('be.visible')
      cy.contains('h1', pagina.titulo).should('be.visible')
      cy.contains('Esta página será desenvolvida em uma próxima etapa.').should(
        'be.visible',
      )
    })
  })

  it('mostra título e texto básico nas páginas placeholder', () => {
    paginasPlaceholder.forEach((pagina) => {
      cy.visit(pagina.rota)
      cy.get('[data-cy=placeholder-page]').should('be.visible')
      cy.contains('h1', pagina.titulo).should('be.visible')
      cy.contains('Esta página será desenvolvida em uma próxima etapa.').should(
        'be.visible',
      )
    })
  })
})
