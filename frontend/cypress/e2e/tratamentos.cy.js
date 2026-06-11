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
    termos_relacionados: [
      { id: 5, termo: 'FIV' },
      { id: 2, termo: 'Embrião' },
    ],
  },
  {
    id: 2,
    nome: 'Inseminação intrauterina (IIU)',
    descricao: 'Espermatozoides preparados são colocados no útero.',
    indicacao: 'Indicada em casos leves de infertilidade.',
    etapas: [],
    termos_relacionados: [],
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

  it('mostra os chips de termos do dicionário e leva ao dicionário filtrado', () => {
    cy.intercept('GET', ROTA_LISTA, { body: tratamentosMock }).as('listar')
    cy.intercept('GET', '**/api/dicionario/termos/**', { body: [] })
    visitarTratamentos()
    cy.wait('@listar')

    cy.get('[data-cy=tratamentos-card]')
      .filter(':contains("Fertilização in vitro (FIV)")')
      .within(() => {
        cy.get('[data-cy=termos-relacionados]').should('be.visible')
        cy.get('[data-cy=termo-relacionado-chip]').should('have.length', 2)
        cy.get('[data-cy=termo-relacionado-chip][data-termo="Embrião"]')
          .should('have.attr', 'href')
          .and('include', '/dicionario?busca=')
        cy.get(
          '[data-cy=termo-relacionado-chip][data-termo="Embrião"]',
        ).click()
      })

    cy.location('pathname').should('eq', '/dicionario')
    cy.location('search').should('include', 'busca=')
  })

  it('não renderiza o bloco de termos quando o tratamento não tem termos', () => {
    cy.intercept('GET', ROTA_LISTA, { body: tratamentosMock }).as('listar')
    visitarTratamentos()
    cy.wait('@listar')

    cy.get('[data-cy=tratamentos-card]')
      .filter(':contains("Inseminação intrauterina (IIU)")')
      .within(() => {
        cy.get('[data-cy=termos-relacionados]').should('not.exist')
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

  it('abre o detalhe do tratamento ao clicar no título do card', () => {
    cy.intercept('GET', '**/api/tratamentos/', { body: tratamentosMock }).as(
      'listar',
    )
    cy.intercept('GET', '**/api/tratamentos/1/', {
      body: tratamentosMock[0],
    }).as('detalhe')
    cy.intercept('GET', '**/api/dicionario/termos/**', { body: [] })
    visitarTratamentos()
    cy.wait('@listar')

    cy.get('[data-cy=tratamentos-card]')
      .filter(':contains("Fertilização in vitro (FIV)")')
      .find('[data-cy=tratamentos-card-link]')
      .click()
    cy.wait('@detalhe')

    cy.location('pathname').should('eq', '/tratamentos/1')
    cy.get('[data-cy=page-tratamento-detalhe]').should('be.visible')
    cy.contains('h1', 'Fertilização in vitro (FIV)').should('be.visible')
    cy.get('[data-cy=tratamento-detalhe-etapas]').should(
      'contain',
      'Estimulação ovariana',
    )
  })

  it('mostra o detalhe completo ao acessar /tratamentos/:id direto', () => {
    cy.intercept('GET', '**/api/tratamentos/1/', {
      body: tratamentosMock[0],
    }).as('detalhe')
    cy.intercept('GET', '**/api/dicionario/termos/**', { body: [] })
    visitarTratamentos('/tratamentos/1')
    cy.wait('@detalhe')

    cy.contains('h1', 'Fertilização in vitro (FIV)').should('be.visible')
    cy.get('[data-cy=tratamento-detalhe-descricao]').should(
      'contain',
      'Une óvulo e espermatozoide',
    )
    cy.get('[data-cy=tratamento-detalhe-indicacao]').should(
      'contain',
      'casos variados de infertilidade',
    )
    cy.get('[data-cy=tratamento-detalhe-etapas]')
      .should('contain', 'Estimulação ovariana')
      .and('contain', 'Transferência embrionária')
    cy.get('[data-cy=termo-relacionado-chip]').should('have.length', 2)
  })

  it('mostra estado de não encontrado quando o tratamento não existe', () => {
    cy.intercept('GET', '**/api/tratamentos/999/', {
      statusCode: 404,
      body: { detail: 'Tratamento não encontrado.' },
    }).as('detalhe')
    visitarTratamentos('/tratamentos/999')
    cy.wait('@detalhe')

    cy.get('[data-cy=tratamento-detalhe-nao-encontrado]').should('be.visible')
  })

  it('o botão voltar retorna à lista de tratamentos', () => {
    cy.intercept('GET', '**/api/tratamentos/1/', {
      body: tratamentosMock[0],
    }).as('detalhe')
    cy.intercept('GET', '**/api/tratamentos/', { body: tratamentosMock }).as(
      'listar',
    )
    cy.intercept('GET', '**/api/dicionario/termos/**', { body: [] })
    visitarTratamentos('/tratamentos/1')
    cy.wait('@detalhe')

    cy.get('[data-cy=tratamento-detalhe-voltar]').click()
    cy.wait('@listar')
    cy.location('pathname').should('eq', '/tratamentos')
    cy.get('[data-cy=page-tratamentos]').should('be.visible')
  })
})
