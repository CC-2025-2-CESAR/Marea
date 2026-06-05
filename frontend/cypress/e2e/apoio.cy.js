const ROTA_LISTA = '**/api/apoio/**'

// A página /apoio vive dentro do AppLayout protegido, então todo cy.visit
// precisa de uma sessão fake no localStorage. O conteúdo é público no backend.
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

function visitarApoio(rota = '/apoio') {
  return cy.visit(rota, {
    onBeforeLoad(janela) {
      janela.localStorage.setItem('marea_auth', JSON.stringify(SESSAO_FAKE))
    },
  })
}

const conteudosMock = [
  {
    id: 1,
    titulo: 'Um dia de cada vez',
    texto: 'Tente focar na etapa de agora, sem antecipar tudo.',
    categoria: 'Ansiedade',
  },
  {
    id: 2,
    titulo: 'A espera pelo resultado',
    texto: 'É natural oscilar entre esperança e medo.',
    categoria: 'Espera',
  },
]

describe('Apoio emocional da Amare', () => {
  it('exibe o título da página', () => {
    cy.intercept('GET', ROTA_LISTA, { body: conteudosMock }).as('listar')
    visitarApoio()
    cy.wait('@listar')
    cy.get('[data-cy=page-apoio]').should('be.visible')
    cy.contains('h1', 'Apoio emocional').should('be.visible')
  })

  it('mostra o aviso de que não substitui acompanhamento profissional', () => {
    cy.intercept('GET', ROTA_LISTA, { body: conteudosMock }).as('listar')
    visitarApoio()
    cy.wait('@listar')
    cy.get('[data-cy=apoio-aviso]')
      .should('be.visible')
      .and('contain', 'não substitui')
  })

  it('mostra o grid de conteúdos quando a API retorna dados', () => {
    cy.intercept('GET', ROTA_LISTA, { body: conteudosMock }).as('listar')
    visitarApoio()
    cy.wait('@listar')
    cy.get('[data-cy=apoio-grid]').should('be.visible')
    cy.get('[data-cy=apoio-card]').should('have.length', 2)
    cy.get('[data-cy=apoio-grid]')
      .should('contain', 'Um dia de cada vez')
      .and('contain', 'A espera pelo resultado')
  })

  it('cada card mostra título, texto e tag de categoria', () => {
    cy.intercept('GET', ROTA_LISTA, { body: conteudosMock }).as('listar')
    visitarApoio()
    cy.wait('@listar')

    cy.get('[data-cy=apoio-card]')
      .filter(':contains("A espera pelo resultado")')
      .within(() => {
        cy.contains('h2', 'A espera pelo resultado').should('be.visible')
        cy.contains('É natural oscilar entre esperança e medo.').should(
          'be.visible',
        )
        cy.get('[data-cy=apoio-card-tag]')
          .should('be.visible')
          .and('contain', 'Espera')
      })
  })

  it('exibe mensagem quando a API retorna lista vazia (com o aviso visível)', () => {
    cy.intercept('GET', ROTA_LISTA, { body: [] }).as('listar')
    visitarApoio()
    cy.wait('@listar')
    cy.get('[data-cy=apoio-aviso]').should('be.visible')
    cy.get('[data-cy=apoio-mensagem-vazia]')
      .should('be.visible')
      .and('contain', 'Nenhum conteúdo de apoio cadastrado no momento.')
  })

  it('exibe mensagem de erro quando a API falha', () => {
    cy.intercept('GET', ROTA_LISTA, { statusCode: 500, body: {} }).as('falha')
    visitarApoio()
    cy.wait('@falha')
    cy.get('[data-cy=apoio-mensagem-erro]')
      .should('be.visible')
      .and('contain', 'Não foi possível carregar os conteúdos no momento.')
  })
})
