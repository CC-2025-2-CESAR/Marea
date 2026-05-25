const ROTA_LISTA = '**/api/dicionario/termos/**'

const termosMock = [
  {
    id: 1,
    termo: 'Beta hCG',
    definicao: 'Hormônio produzido durante a gravidez.',
    categoria: 'Exame',
    exemplo: 'Exame realizado após transferência de embriões.',
    artigos_relacionados: [
      { titulo: 'Como entender o resultado', url: '#' },
    ],
  },
  {
    id: 2,
    termo: 'Endometriose',
    definicao: 'Condição em que o tecido cresce fora do útero.',
    categoria: 'Doença',
    exemplo: '',
    artigos_relacionados: [
      { titulo: 'Endometriose e fertilidade', url: '#' },
      { titulo: 'Sinais que merecem atenção', url: '#' },
    ],
  },
  {
    id: 3,
    termo: 'FIV',
    definicao: 'Sigla de Fertilização in Vitro.',
    categoria: 'Procedimento',
    exemplo: 'Tratamento oferecido pela clínica.',
    artigos_relacionados: [],
  },
  {
    id: 4,
    termo: 'Progesterona',
    definicao: 'Hormônio importante na fase final do ciclo.',
    categoria: 'Remédio',
    exemplo: '',
    artigos_relacionados: [],
  },
]

describe('Dicionário da Amare', () => {
  it('exibe o título da página', () => {
    cy.intercept('GET', ROTA_LISTA, { body: termosMock }).as('listar')
    cy.visit('/dicionario')
    cy.wait('@listar')
    cy.get('[data-cy=page-dicionario]').should('be.visible')
    cy.contains('h1', 'Dicionário').should('be.visible')
  })

  it('mostra o grid de termos quando a API retorna dados', () => {
    cy.intercept('GET', ROTA_LISTA, { body: termosMock }).as('listar')
    cy.visit('/dicionario')
    cy.wait('@listar')
    cy.get('[data-cy=dicionario-grid]').should('be.visible')
    cy.get('[data-cy=dicionario-card]').should('have.length', 4)
    cy.get('[data-cy=dicionario-grid]')
      .should('contain', 'Beta hCG')
      .and('contain', 'Endometriose')
      .and('contain', 'FIV')
      .and('contain', 'Progesterona')
  })

  it('exibe mensagem quando a API retorna lista vazia', () => {
    cy.intercept('GET', ROTA_LISTA, { body: [] }).as('listar')
    cy.visit('/dicionario')
    cy.wait('@listar')
    cy.get('[data-cy=dicionario-mensagem-vazia]')
      .should('be.visible')
      .and('contain', 'Nenhum termo encontrado.')
  })

  it('cada card mostra título, definição, artigos relacionados e tag', () => {
    cy.intercept('GET', ROTA_LISTA, { body: termosMock }).as('listar')
    cy.visit('/dicionario')
    cy.wait('@listar')

    cy.get('[data-cy=dicionario-card]')
      .filter(':contains("Endometriose")')
      .within(() => {
        cy.contains('h2', 'Endometriose').should('be.visible')
        cy.contains(
          'Condição em que o tecido cresce fora do útero.',
        ).should('be.visible')
        cy.get('[data-cy=dicionario-card-artigos]')
          .should('contain', 'Endometriose e fertilidade')
          .and('contain', 'Sinais que merecem atenção')
        cy.get('[data-cy=dicionario-card-tag]')
          .should('be.visible')
          .and('contain', 'Doença')
      })
  })

  it('filtra termos ao enviar uma busca', () => {
    cy.intercept('GET', '**/api/dicionario/termos/', { body: termosMock }).as(
      'listarInicial',
    )
    cy.visit('/dicionario')
    cy.wait('@listarInicial')

    cy.intercept('GET', '**/api/dicionario/termos/?busca=fiv', {
      body: [termosMock[2]],
    }).as('buscar')

    cy.get('[data-cy=dicionario-busca-input]').type('fiv')
    cy.get('[data-cy=dicionario-busca-submit]').click()
    cy.wait('@buscar')

    cy.get('[data-cy=dicionario-card]').should('have.length', 1)
    cy.get('[data-cy=dicionario-grid]').should('contain', 'FIV')
  })

  it('exibe mensagem vazia quando a busca não tem resultados', () => {
    cy.intercept('GET', '**/api/dicionario/termos/', { body: termosMock }).as(
      'listarInicial',
    )
    cy.visit('/dicionario')
    cy.wait('@listarInicial')

    cy.intercept('GET', '**/api/dicionario/termos/?busca=xyz', {
      body: [],
    }).as('buscar')
    cy.get('[data-cy=dicionario-busca-input]').type('xyz')
    cy.get('[data-cy=dicionario-busca-submit]').click()
    cy.wait('@buscar')

    cy.get('[data-cy=dicionario-mensagem-vazia]')
      .should('be.visible')
      .and('contain', 'Nenhum termo encontrado.')
  })

  it('filtra o grid ao selecionar uma categoria nos chips', () => {
    cy.intercept('GET', ROTA_LISTA, { body: termosMock }).as('listar')
    cy.visit('/dicionario')
    cy.wait('@listar')

    cy.get('[data-cy=dicionario-filtro-chip][data-categoria="Doença"]').click()
    cy.get('[data-cy=dicionario-card]').should('have.length', 1)
    cy.get('[data-cy=dicionario-grid]').should('contain', 'Endometriose')
    cy.get('[data-cy=dicionario-grid]').should('not.contain', 'FIV')
  })

  it('chip "Todos" remove o filtro de categoria', () => {
    cy.intercept('GET', ROTA_LISTA, { body: termosMock }).as('listar')
    cy.visit('/dicionario')
    cy.wait('@listar')

    cy.get(
      '[data-cy=dicionario-filtro-chip][data-categoria="Remédio"]',
    ).click()
    cy.get('[data-cy=dicionario-card]').should('have.length', 1)

    cy.get(
      '[data-cy=dicionario-filtro-chip][data-categoria="__todos__"]',
    ).click()
    cy.get('[data-cy=dicionario-card]').should('have.length', 4)
  })

  it('exibe mensagem de erro quando a API falha', () => {
    cy.intercept('GET', ROTA_LISTA, { statusCode: 500, body: {} }).as('falha')
    cy.visit('/dicionario')
    cy.wait('@falha')
    cy.get('[data-cy=dicionario-mensagem-erro]')
      .should('be.visible')
      .and('contain', 'Não foi possível carregar os termos no momento.')
  })
})
