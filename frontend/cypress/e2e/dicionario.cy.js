const ROTA_LISTA = '**/api/dicionario/termos/**'

// Sessao fake para passar pela ProtectedRoute. O dicionario em si e publico
// no backend, mas a rota /dicionario no frontend vive dentro do AppLayout
// protegido — entao todo `cy.visit` precisa setar o localStorage primeiro.
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

function visitarDicionario(rota = '/dicionario') {
  return cy.visit(rota, {
    onBeforeLoad(janela) {
      janela.localStorage.setItem('marea_auth', JSON.stringify(SESSAO_FAKE))
    },
  })
}

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
    visitarDicionario()
    cy.wait('@listar')
    cy.get('[data-cy=page-dicionario]').should('be.visible')
    cy.contains('h1', 'Dicionário').should('be.visible')
  })

  it('mostra o grid de termos quando a API retorna dados', () => {
    cy.intercept('GET', ROTA_LISTA, { body: termosMock }).as('listar')
    visitarDicionario()
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
    visitarDicionario()
    cy.wait('@listar')
    cy.get('[data-cy=dicionario-mensagem-vazia]')
      .should('be.visible')
      .and('contain', 'Nenhum termo encontrado.')
  })

  it('cada card mostra título, definição, artigos relacionados e tag', () => {
    cy.intercept('GET', ROTA_LISTA, { body: termosMock }).as('listar')
    visitarDicionario()
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
    visitarDicionario()
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

  it('abre já filtrado quando recebe ?busca= na URL (deep-link)', () => {
    // Simula o clique num chip "termo relacionado" de Tratamentos/Orientações,
    // que navega para /dicionario?busca=<termo>.
    cy.intercept('GET', '**/api/dicionario/termos/?busca=*', {
      body: [termosMock[2]],
    }).as('buscarDeepLink')

    visitarDicionario('/dicionario?busca=FIV')
    cy.wait('@buscarDeepLink')

    cy.get('[data-cy=dicionario-busca-input]').should('have.value', 'FIV')
    cy.get('[data-cy=dicionario-card]').should('have.length', 1)
    cy.get('[data-cy=dicionario-grid]').should('contain', 'FIV')
  })

  it('exibe mensagem vazia quando a busca não tem resultados', () => {
    cy.intercept('GET', '**/api/dicionario/termos/', { body: termosMock }).as(
      'listarInicial',
    )
    visitarDicionario()
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
    visitarDicionario()
    cy.wait('@listar')

    cy.get('[data-cy=dicionario-filtro-chip][data-categoria="Doença"]').click()
    cy.get('[data-cy=dicionario-card]').should('have.length', 1)
    cy.get('[data-cy=dicionario-grid]').should('contain', 'Endometriose')
    cy.get('[data-cy=dicionario-grid]').should('not.contain', 'FIV')
  })

  it('chip "Todos" remove o filtro de categoria', () => {
    cy.intercept('GET', ROTA_LISTA, { body: termosMock }).as('listar')
    visitarDicionario()
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
    visitarDicionario()
    cy.wait('@falha')
    cy.get('[data-cy=dicionario-mensagem-erro]')
      .should('be.visible')
      .and('contain', 'Não foi possível carregar os termos no momento.')
  })

  it('abre o detalhe do termo ao clicar no título do card', () => {
    cy.intercept('GET', '**/api/dicionario/termos/', { body: termosMock }).as(
      'listar',
    )
    cy.intercept('GET', '**/api/dicionario/termos/2/', {
      body: termosMock[1],
    }).as('detalhe')
    visitarDicionario()
    cy.wait('@listar')

    cy.get('[data-cy=dicionario-card]')
      .filter(':contains("Endometriose")')
      .find('[data-cy=dicionario-card-link]')
      .click()
    cy.wait('@detalhe')

    cy.location('pathname').should('eq', '/dicionario/2')
    cy.get('[data-cy=page-termo-detalhe]').should('be.visible')
    cy.contains('h1', 'Endometriose').should('be.visible')
    cy.get('[data-cy=termo-detalhe-definicao]').should(
      'contain',
      'tecido cresce fora do útero',
    )
  })

  it('mostra o detalhe completo ao acessar /dicionario/:id direto', () => {
    cy.intercept('GET', '**/api/dicionario/termos/1/', {
      body: termosMock[0],
    }).as('detalhe')
    visitarDicionario('/dicionario/1')
    cy.wait('@detalhe')

    cy.contains('h1', 'Beta hCG').should('be.visible')
    cy.get('[data-cy=termo-detalhe-tag]').should('contain', 'Exame')
    cy.get('[data-cy=termo-detalhe-definicao]').should(
      'contain',
      'Hormônio produzido durante a gravidez.',
    )
    cy.get('[data-cy=termo-detalhe-exemplo]').should(
      'contain',
      'transferência de embriões',
    )
    cy.get('[data-cy=termo-detalhe-artigos]').should(
      'contain',
      'Como entender o resultado',
    )
  })

  it('mostra estado de não encontrado quando o termo não existe', () => {
    cy.intercept('GET', '**/api/dicionario/termos/999/', {
      statusCode: 404,
      body: { detail: 'Termo não encontrado.' },
    }).as('detalhe')
    visitarDicionario('/dicionario/999')
    cy.wait('@detalhe')

    cy.get('[data-cy=termo-detalhe-nao-encontrado]').should('be.visible')
  })

  it('o botão voltar retorna à lista do dicionário', () => {
    cy.intercept('GET', '**/api/dicionario/termos/1/', {
      body: termosMock[0],
    }).as('detalhe')
    cy.intercept('GET', '**/api/dicionario/termos/', { body: termosMock }).as(
      'listar',
    )
    visitarDicionario('/dicionario/1')
    cy.wait('@detalhe')

    cy.get('[data-cy=termo-detalhe-voltar]').click()
    cy.wait('@listar')
    cy.location('pathname').should('eq', '/dicionario')
    cy.get('[data-cy=page-dicionario]').should('be.visible')
  })
})
