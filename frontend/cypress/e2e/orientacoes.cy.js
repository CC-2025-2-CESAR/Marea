const ROTA_LISTA = '**/api/orientacoes/**'

// A página /orientacoes vive dentro do AppLayout protegido, então todo
// cy.visit precisa de uma sessão fake no localStorage.
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

function visitarOrientacoes(rota = '/orientacoes') {
  return cy.visit(rota, {
    onBeforeLoad(janela) {
      janela.localStorage.setItem('marea_auth', JSON.stringify(SESSAO_FAKE))
    },
  })
}

const orientacoesMock = [
  {
    id: 1,
    titulo: 'Como se preparar para a coleta de óvulos',
    conteudo: 'Mantenha o jejum conforme a orientação da equipe.',
    categoria: 'Procedimentos',
    tratamento: 1,
    tratamento_nome: 'Fertilização in vitro (FIV)',
    etapa: 3,
    etapa_titulo: 'Coleta dos óvulos',
  },
  {
    id: 2,
    titulo: 'Lidando com a ansiedade da espera',
    conteudo: 'Respire fundo e busque apoio quando precisar.',
    categoria: 'Apoio emocional',
    tratamento: null,
    tratamento_nome: '',
    etapa: null,
    etapa_titulo: '',
  },
  {
    id: 3,
    titulo: 'Como aplicar as medicações hormonais em casa',
    conteudo: 'Guarde conforme a orientação e respeite os horários.',
    categoria: 'Medicação',
    tratamento: null,
    tratamento_nome: '',
    etapa: null,
    etapa_titulo: '',
  },
]

describe('Orientações da Amare', () => {
  it('exibe o título da página', () => {
    cy.intercept('GET', ROTA_LISTA, { body: orientacoesMock }).as('listar')
    visitarOrientacoes()
    cy.wait('@listar')
    cy.get('[data-cy=page-orientacoes]').should('be.visible')
    cy.contains('h1', 'Orientações').should('be.visible')
  })

  it('mostra o grid de orientações quando a API retorna dados', () => {
    cy.intercept('GET', ROTA_LISTA, { body: orientacoesMock }).as('listar')
    visitarOrientacoes()
    cy.wait('@listar')
    cy.get('[data-cy=orientacoes-grid]').should('be.visible')
    cy.get('[data-cy=orientacoes-card]').should('have.length', 3)
  })

  it('cada card mostra título, conteúdo, relação e tag', () => {
    cy.intercept('GET', ROTA_LISTA, { body: orientacoesMock }).as('listar')
    visitarOrientacoes()
    cy.wait('@listar')

    cy.get('[data-cy=orientacoes-card]')
      .filter(':contains("Como se preparar para a coleta de óvulos")')
      .within(() => {
        cy.contains('h2', 'Como se preparar para a coleta de óvulos').should(
          'be.visible',
        )
        cy.get('[data-cy=orientacoes-card-relacao]')
          .should('contain', 'Fertilização in vitro (FIV)')
          .and('contain', 'Coleta dos óvulos')
        cy.get('[data-cy=orientacoes-card-tag]')
          .should('be.visible')
          .and('contain', 'Procedimentos')
      })
  })

  it('filtra as orientações ao selecionar uma categoria', () => {
    cy.intercept('GET', ROTA_LISTA, { body: orientacoesMock }).as('listar')
    visitarOrientacoes()
    cy.wait('@listar')

    cy.get(
      '[data-cy=orientacoes-filtro-chip][data-categoria="Apoio emocional"]',
    ).click()
    cy.get('[data-cy=orientacoes-card]').should('have.length', 1)
    cy.get('[data-cy=orientacoes-grid]')
      .should('contain', 'Lidando com a ansiedade da espera')
      .and('not.contain', 'Como aplicar as medicações hormonais em casa')
  })

  it('chip "Todas" remove o filtro de categoria', () => {
    cy.intercept('GET', ROTA_LISTA, { body: orientacoesMock }).as('listar')
    visitarOrientacoes()
    cy.wait('@listar')

    cy.get(
      '[data-cy=orientacoes-filtro-chip][data-categoria="Medicação"]',
    ).click()
    cy.get('[data-cy=orientacoes-card]').should('have.length', 1)

    cy.get(
      '[data-cy=orientacoes-filtro-chip][data-categoria="__todos__"]',
    ).click()
    cy.get('[data-cy=orientacoes-card]').should('have.length', 3)
  })

  it('exibe mensagem quando a API retorna lista vazia', () => {
    cy.intercept('GET', ROTA_LISTA, { body: [] }).as('listar')
    visitarOrientacoes()
    cy.wait('@listar')
    cy.get('[data-cy=orientacoes-mensagem-vazia]')
      .should('be.visible')
      .and('contain', 'Nenhuma orientação cadastrada no momento.')
  })

  it('exibe mensagem de erro quando a API falha', () => {
    cy.intercept('GET', ROTA_LISTA, { statusCode: 500, body: {} }).as('falha')
    visitarOrientacoes()
    cy.wait('@falha')
    cy.get('[data-cy=orientacoes-mensagem-erro]')
      .should('be.visible')
      .and('contain', 'Não foi possível carregar as orientações no momento.')
  })
})
