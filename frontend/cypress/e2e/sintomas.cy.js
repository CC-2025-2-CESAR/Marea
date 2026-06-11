const ROTA = '**/api/sintomas/'
// Detalhe do registro (editar/excluir). PATCH e DELETE só batem aqui — nunca na
// lista —, então o glob mais amplo não colide com os interceptadores de GET/POST.
const ROTA_ITEM = '**/api/sintomas/*'

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

function semScrollHorizontal() {
  cy.window().then((janela) => {
    const documento = janela.document.documentElement
    expect(
      documento.scrollWidth,
      'scrollWidth deve caber dentro da viewport',
    ).to.be.lte(janela.innerWidth)
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

    cy.get('[data-cy=toast]').should('be.visible')
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

  it('edita um registro existente', () => {
    cy.intercept('GET', ROTA, { body: registrosMock }).as('listar')
    visitarSintomas()
    cy.wait('@listar')

    cy.intercept('PATCH', ROTA_ITEM, {
      statusCode: 200,
      body: {
        ...registrosMock[0],
        descricao: 'Inchaço bem mais forte à noite.',
        intensidade: 4,
      },
    }).as('atualizar')

    cy.get('[data-cy=sintomas-item-editar]').click()
    cy.contains('h2', 'Editar registro').should('be.visible')
    cy.get('[data-cy=sintomas-descricao]')
      .clear()
      .type('Inchaço bem mais forte à noite.')
    cy.get('[data-cy=sintomas-enviar]').click()
    cy.wait('@atualizar').its('request.method').should('eq', 'PATCH')

    cy.get('[data-cy=toast]').should('be.visible').and('contain', 'atualizado')
    cy.get('[data-cy=sintomas-lista]').should(
      'contain',
      'Inchaço bem mais forte à noite.',
    )
  })

  it('exclui um registro com confirmação', () => {
    cy.intercept('GET', ROTA, { body: registrosMock }).as('listar')
    visitarSintomas()
    cy.wait('@listar')

    cy.intercept('DELETE', ROTA_ITEM, { statusCode: 204 }).as('excluir')

    cy.get('[data-cy=sintomas-item-excluir]').click()
    cy.get('[data-cy=sintomas-confirmar-exclusao]').should('be.visible')
    cy.get('[data-cy=sintomas-confirmar-sim]').click()
    cy.wait('@excluir').its('request.method').should('eq', 'DELETE')

    cy.get('[data-cy=sintomas-item]').should('not.exist')
    cy.get('[data-cy=sintomas-vazia]').should('be.visible')
  })

  it('cancela a exclusão e mantém o registro', () => {
    cy.intercept('GET', ROTA, { body: registrosMock }).as('listar')
    visitarSintomas()
    cy.wait('@listar')

    cy.get('[data-cy=sintomas-item-excluir]').click()
    cy.get('[data-cy=sintomas-confirmar-exclusao]').should('be.visible')
    cy.get('[data-cy=sintomas-confirmar-nao]').click()

    cy.get('[data-cy=sintomas-confirmar-exclusao]').should('not.exist')
    cy.get('[data-cy=sintomas-item]').should('have.length', 1)
  })

  it('mostra editar/excluir com alvo de toque no mobile', () => {
    cy.viewport(390, 844)
    cy.intercept('GET', ROTA, { body: registrosMock }).as('listar')
    visitarSintomas()
    cy.wait('@listar')

    cy.get('[data-cy=sintomas-item-editar]').should('be.visible')
    cy.get('[data-cy=sintomas-item-excluir]')
      .should('be.visible')
      .then(($botao) => {
        expect($botao[0].getBoundingClientRect().height).to.be.at.least(44)
      })
    semScrollHorizontal()
  })
})
