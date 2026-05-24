const ROTA_LISTA = '**/api/dicionario/termos/**'

const termosMock = [
  {
    id: 1,
    termo: 'Beta hCG',
    definicao: 'Hormônio produzido durante a gravidez.',
    categoria: 'Exames',
    exemplo: 'Exame realizado após transferência de embriões.',
  },
  {
    id: 4,
    termo: 'FIV',
    definicao: 'Sigla de Fertilização in Vitro.',
    categoria: 'Procedimentos',
    exemplo: 'Tratamento oferecido pela clínica.',
  },
  {
    id: 7,
    termo: 'Ovulação',
    definicao: 'Momento em que o óvulo é liberado.',
    categoria: 'Biologia',
    exemplo: 'Ajuda a programar exames e consultas.',
  },
]

describe('Dicionário do Maréa', () => {
  it('exibe o título da página', () => {
    cy.intercept('GET', ROTA_LISTA, { body: termosMock }).as('listar')
    cy.visit('/dicionario')
    cy.wait('@listar')
    cy.get('[data-cy=page-dicionario]').should('be.visible')
    cy.contains('h1', 'Dicionário').should('be.visible')
  })

  it('lista termos quando a API retorna dados', () => {
    cy.intercept('GET', ROTA_LISTA, { body: termosMock }).as('listar')
    cy.visit('/dicionario')
    cy.wait('@listar')
    cy.get('[data-cy=dicionario-lista]')
      .should('contain', 'Beta hCG')
      .and('contain', 'FIV')
      .and('contain', 'Ovulação')
    cy.get('[data-cy=dicionario-card]').should('have.length', 3)
  })

  it('exibe mensagem quando a API retorna lista vazia', () => {
    cy.intercept('GET', ROTA_LISTA, { body: [] }).as('listar')
    cy.visit('/dicionario')
    cy.wait('@listar')
    cy.get('[data-cy=dicionario-mensagem-vazia]')
      .should('be.visible')
      .and('contain', 'Nenhum termo encontrado.')
  })

  it('mostra mensagem orientando a seleção quando nenhum termo está aberto', () => {
    cy.intercept('GET', ROTA_LISTA, { body: termosMock }).as('listar')
    cy.visit('/dicionario')
    cy.wait('@listar')
    cy.get('[data-cy=dicionario-mensagem-selecione]')
      .should('be.visible')
      .and('contain', 'Selecione um termo')
  })

  it('filtra termos ao enviar uma busca', () => {
    cy.intercept('GET', '**/api/dicionario/termos/', { body: termosMock }).as(
      'listarInicial',
    )
    cy.visit('/dicionario')
    cy.wait('@listarInicial')

    cy.intercept('GET', '**/api/dicionario/termos/?busca=fiv', {
      body: [termosMock[1]],
    }).as('buscar')

    cy.get('[data-cy=dicionario-busca-input]').type('fiv')
    cy.get('[data-cy=dicionario-busca-submit]').click()
    cy.wait('@buscar')

    cy.get('[data-cy=dicionario-card]').should('have.length', 1)
    cy.get('[data-cy=dicionario-lista]').should('contain', 'FIV')
  })

  it('exibe mensagem vazia quando a busca não tem resultados', () => {
    cy.intercept('GET', '**/api/dicionario/termos/', { body: termosMock }).as(
      'listarInicial',
    )
    cy.visit('/dicionario')
    cy.wait('@listarInicial')

    cy.intercept('GET', '**/api/dicionario/termos/?busca=xyz', { body: [] }).as(
      'buscar',
    )
    cy.get('[data-cy=dicionario-busca-input]').type('xyz')
    cy.get('[data-cy=dicionario-busca-submit]').click()
    cy.wait('@buscar')

    cy.get('[data-cy=dicionario-mensagem-vazia]')
      .should('be.visible')
      .and('contain', 'Nenhum termo encontrado.')
  })

  it('abre os detalhes ao clicar em um termo', () => {
    cy.intercept('GET', ROTA_LISTA, { body: termosMock }).as('listar')
    cy.visit('/dicionario')
    cy.wait('@listar')

    cy.get('[data-cy=dicionario-card]').contains('FIV').click()
    cy.get('[data-cy=dicionario-detalhes]')
      .should('contain', 'FIV')
      .and('contain', 'Sigla de Fertilização in Vitro.')
      .and('contain', 'Procedimentos')
      .and('contain', 'Exemplo')
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
