const ROTA_LISTA = '**/api/tratamentos/**'

// A página /tratamentos vive dentro do AppLayout protegido, então todo
// cy.visit precisa de uma sessão fake no localStorage. O conteúdo em si é
// público no backend.
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

function visitarTratamentos(rota = '/tratamentos') {
  return cy.visit(rota, {
    onBeforeLoad(janela) {
      janela.localStorage.setItem('marea_auth', JSON.stringify(SESSAO_FAKE))
    },
  })
}

const tratamentosMock = [
  {
    id: 1,
    nome: 'Fertilização in vitro (FIV)',
    descricao: 'Une óvulo e espermatozoide em laboratório.',
    indicacao: 'Indicada em casos variados de infertilidade.',
    etapas: [
      {
        id: 1,
        titulo: 'Estimulação ovariana',
        descricao: 'Uso de medicação acompanhado por ultrassom.',
        ordem: 1,
      },
      { id: 2, titulo: 'Transferência embrionária', descricao: '', ordem: 2 },
    ],
  },
  {
    id: 2,
    nome: 'Inseminação intrauterina (IIU)',
    descricao: 'Espermatozoides preparados são colocados no útero.',
    indicacao: 'Indicada em casos leves de infertilidade.',
    etapas: [],
  },
]

describe('Tratamentos da Amare', () => {
  it('exibe o título da página', () => {
    cy.intercept('GET', ROTA_LISTA, { body: tratamentosMock }).as('listar')
    visitarTratamentos()
    cy.wait('@listar')
    cy.get('[data-cy=page-tratamentos]').should('be.visible')
    cy.contains('h1', 'Tratamentos').should('be.visible')
  })

  it('mostra o grid de tratamentos quando a API retorna dados', () => {
    cy.intercept('GET', ROTA_LISTA, { body: tratamentosMock }).as('listar')
    visitarTratamentos()
    cy.wait('@listar')
    cy.get('[data-cy=tratamentos-grid]').should('be.visible')
    cy.get('[data-cy=tratamentos-card]').should('have.length', 2)
    cy.get('[data-cy=tratamentos-grid]')
      .should('contain', 'Fertilização in vitro (FIV)')
      .and('contain', 'Inseminação intrauterina (IIU)')
  })

  it('cada card mostra nome, descrição, indicação e etapas', () => {
    cy.intercept('GET', ROTA_LISTA, { body: tratamentosMock }).as('listar')
    visitarTratamentos()
    cy.wait('@listar')

    cy.get('[data-cy=tratamentos-card]')
      .filter(':contains("Fertilização in vitro (FIV)")')
      .within(() => {
        cy.contains('h2', 'Fertilização in vitro (FIV)').should('be.visible')
        cy.contains('Une óvulo e espermatozoide em laboratório.').should(
          'be.visible',
        )
        cy.contains('Quando é indicado').should('be.visible')
        cy.get('[data-cy=tratamentos-card-etapas]')
          .should('contain', 'Estimulação ovariana')
          .and('contain', 'Transferência embrionária')
      })
  })

  it('exibe mensagem quando a API retorna lista vazia', () => {
    cy.intercept('GET', ROTA_LISTA, { body: [] }).as('listar')
    visitarTratamentos()
    cy.wait('@listar')
    cy.get('[data-cy=tratamentos-mensagem-vazia]')
      .should('be.visible')
      .and('contain', 'Nenhum tratamento cadastrado no momento.')
  })

  it('exibe mensagem de erro quando a API falha', () => {
    cy.intercept('GET', ROTA_LISTA, { statusCode: 500, body: {} }).as('falha')
    visitarTratamentos()
    cy.wait('@falha')
    cy.get('[data-cy=tratamentos-mensagem-erro]')
      .should('be.visible')
      .and('contain', 'Não foi possível carregar os tratamentos no momento.')
  })
})
