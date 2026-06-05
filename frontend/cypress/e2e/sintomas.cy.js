const ROTA = '**/api/sintomas/'

// A página /sintomas vive dentro do AppLayout protegido. É a primeira tela em
// que a paciente ESCREVE (cria registros), além de ler os próprios.
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

function visitarSintomas(rota = '/sintomas') {
  return cy.visit(rota, {
    onBeforeLoad(janela) {
      janela.localStorage.setItem('marea_auth', JSON.stringify(SESSAO_FAKE))
    },
  })
}

const registrosMock = [
  {
    id: 1,
    data: '2026-06-01',
    tipo: 'Inchaço',
    descricao: 'Leve inchaço no fim do dia.',
    intensidade: 2,
    criado_em: '2026-06-01T10:00:00Z',
  },
]

describe('Sintomas e observações da Amare', () => {
  it('exibe o título e o formulário', () => {
    cy.intercept('GET', ROTA, { body: [] }).as('listar')
    visitarSintomas()
    cy.wait('@listar')
    cy.get('[data-cy=page-sintomas]').should('be.visible')
    cy.contains('h1', 'Sintomas e observações').should('be.visible')
    cy.get('[data-cy=sintomas-form]').should('be.visible')
  })

  it('mostra os registros existentes', () => {
    cy.intercept('GET', ROTA, { body: registrosMock }).as('listar')
    visitarSintomas()
    cy.wait('@listar')
    cy.get('[data-cy=sintomas-item]').should('have.length', 1)
    cy.get('[data-cy=sintomas-lista]')
      .should('contain', 'Inchaço')
      .and('contain', 'Leve inchaço no fim do dia.')
  })

  it('mostra mensagem quando não há registros', () => {
    cy.intercept('GET', ROTA, { body: [] }).as('listar')
    visitarSintomas()
    cy.wait('@listar')
    cy.get('[data-cy=sintomas-vazia]')
      .should('be.visible')
      .and('contain', 'ainda não tem registros')
  })

  it('cria um novo registro e ele aparece na lista', () => {
    cy.intercept('GET', ROTA, { body: [] }).as('listar')
    visitarSintomas()
    cy.wait('@listar')

    cy.intercept('POST', ROTA, {
      statusCode: 201,
      body: {
        id: 9,
        data: '2026-06-05',
        tipo: 'Dor de cabeça',
        descricao: 'Dor leve à tarde.',
        intensidade: null,
        criado_em: '2026-06-05T10:00:00Z',
      },
    }).as('criar')

    cy.get('[data-cy=sintomas-tipo]').type('Dor de cabeça')
    cy.get('[data-cy=sintomas-descricao]').type('Dor leve à tarde.')
    cy.get('[data-cy=sintomas-enviar]').click()
    cy.wait('@criar')

    cy.get('[data-cy=sintomas-sucesso]').should('be.visible')
    cy.get('[data-cy=sintomas-item]').should('have.length', 1)
    cy.get('[data-cy=sintomas-lista]').should('contain', 'Dor de cabeça')
  })

  it('valida campos obrigatórios sem chamar a API', () => {
    cy.intercept('GET', ROTA, { body: [] }).as('listar')
    visitarSintomas()
    cy.wait('@listar')

    // Sem preencher tipo/descrição, o envio é bloqueado no cliente.
    cy.get('[data-cy=sintomas-enviar]').click()
    cy.get('[data-cy=sintomas-erro-envio]')
      .should('be.visible')
      .and('contain', 'Preencha')
  })

  it('exibe erro quando o carregamento falha', () => {
    cy.intercept('GET', ROTA, { statusCode: 500, body: {} }).as('falha')
    visitarSintomas()
    cy.wait('@falha')
    cy.get('[data-cy=sintomas-erro]')
      .should('be.visible')
      .and('contain', 'Não foi possível carregar seus registros no momento.')
  })
})
