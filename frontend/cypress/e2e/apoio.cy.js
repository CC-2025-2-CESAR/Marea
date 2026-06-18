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

  it('cada card e um resumo clicavel (titulo + texto + tag)', () => {
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
        cy.get('[data-cy=apoio-card-link]')
          .should('have.attr', 'href')
          .and('include', '/apoio/2')
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

describe('Detalhe do apoio emocional', () => {
  // Padrões exatos: o da lista NÃO casa com /1/ e o de detalhe NÃO casa com a
  // lista, então interceptam endpoints disjuntos sem ambiguidade.
  const ROTA_LISTA_EXATA = '**/api/apoio/'
  const ROTA_DETALHE_1 = '**/api/apoio/1/'
  const ROTA_DETALHE_2 = '**/api/apoio/2/'
  const ROTA_DETALHE_999 = '**/api/apoio/999/'

  it('abre o detalhe ao clicar no card', () => {
    cy.intercept('GET', ROTA_LISTA_EXATA, { body: conteudosMock }).as('listar')
    cy.intercept('GET', ROTA_DETALHE_2, { body: conteudosMock[1] }).as(
      'detalhar',
    )
    visitarApoio()
    cy.wait('@listar')

    cy.get('[data-cy=apoio-card]')
      .filter(':contains("A espera pelo resultado")')
      .find('[data-cy=apoio-card-link]')
      .click()

    cy.wait('@detalhar')
    cy.location('pathname').should('eq', '/apoio/2')
    cy.get('[data-cy=page-apoio-detalhe]').should('be.visible')
    cy.get('[data-cy=apoio-detalhe-titulo]').should(
      'contain',
      'A espera pelo resultado',
    )
  })

  it('acessa o detalhe diretamente e mostra texto, tag e aviso', () => {
    cy.intercept('GET', ROTA_DETALHE_1, { body: conteudosMock[0] }).as(
      'detalhar',
    )
    visitarApoio('/apoio/1')
    cy.wait('@detalhar')
    cy.get('[data-cy=apoio-detalhe-titulo]').should(
      'contain',
      'Um dia de cada vez',
    )
    cy.get('[data-cy=apoio-detalhe-texto]').should(
      'contain',
      'Tente focar na etapa de agora',
    )
    cy.get('[data-cy=apoio-detalhe-tag]').should('contain', 'Ansiedade')
    cy.get('[data-cy=apoio-detalhe-aviso]')
      .should('be.visible')
      .and('contain', 'não substitui')
  })

  it('mostra o estado de não encontrado quando a API responde 404', () => {
    cy.intercept('GET', ROTA_DETALHE_999, {
      statusCode: 404,
      body: { detail: 'Não encontrado.' },
    }).as('detalhar')
    visitarApoio('/apoio/999')
    cy.wait('@detalhar')
    cy.get('[data-cy=apoio-detalhe-nao-encontrado]').should('be.visible')
  })

  it('volta para a listagem pelo link de voltar', () => {
    cy.intercept('GET', ROTA_LISTA_EXATA, { body: conteudosMock }).as('listar')
    cy.intercept('GET', ROTA_DETALHE_1, { body: conteudosMock[0] }).as(
      'detalhar',
    )
    visitarApoio('/apoio/1')
    cy.wait('@detalhar')
    cy.get('[data-cy=apoio-detalhe-voltar]').click()
    cy.wait('@listar')
    cy.location('pathname').should('eq', '/apoio')
    cy.get('[data-cy=page-apoio]').should('be.visible')
  })
})
