const ROTA = '**/api/busca/**'

// A busca global (PROJ-25) vive dentro do AppLayout protegido. A SearchBar do
// cabeçalho envia o termo para /busca?q=..., que consulta o endpoint unificado
// e mostra os resultados agrupados por tipo.
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

function visitarBusca(rota = '/busca') {
  return cy.visit(rota, {
    onBeforeLoad(janela) {
      janela.localStorage.setItem('marea_auth', JSON.stringify(SESSAO_FAKE))
    },
  })
}

const resultadosMock = [
  {
    tipo: 'termo',
    tipo_label: 'Dicionário',
    id: 1,
    titulo: 'Fertilidade',
    descricao: 'Capacidade de engravidar.',
    url: '/dicionario?busca=Fertilidade',
  },
  {
    tipo: 'tratamento',
    tipo_label: 'Tratamento',
    id: 2,
    titulo: 'Tratamento de fertilidade',
    descricao: 'Conjunto de cuidados para ajudar a engravidar.',
    url: '/tratamentos',
  },
  {
    tipo: 'orientacao',
    tipo_label: 'Orientação',
    id: 3,
    titulo: 'Dicas de fertilidade',
    descricao: 'Hábitos que favorecem a saúde reprodutiva.',
    url: '/orientacoes',
  },
  {
    tipo: 'especialidade',
    tipo_label: 'Especialidade',
    id: 4,
    titulo: 'Saúde reprodutiva',
    descricao: 'Cuida da fertilidade do casal.',
    url: '/especialidades',
  },
]

describe('Busca global da Amare', () => {
  it('mostra os resultados agrupados por tipo', () => {
    cy.intercept('GET', ROTA, { body: resultadosMock }).as('buscar')
    visitarBusca('/busca?q=fertil')
    cy.wait('@buscar')
    cy.get('[data-cy=page-busca]').should('be.visible')
    cy.contains('h1', 'Busca').should('be.visible')
    cy.get('[data-cy=busca-grupo]').should('have.length', 4)
    cy.get('[data-cy=busca-item]').should('have.length', 4)
    cy.get('[data-cy=busca-grupo][data-tipo=termo]').should(
      'contain',
      'Dicionário',
    )
    cy.get('[data-cy=busca-resultados]').should('contain', 'Fertilidade')
  })

  it('cada resultado leva ao destino certo (deep-link)', () => {
    cy.intercept('GET', ROTA, { body: resultadosMock }).as('buscar')
    visitarBusca('/busca?q=fertil')
    cy.wait('@buscar')
    cy.get('[data-cy=busca-item][data-tipo=termo] a').should(
      'have.attr',
      'href',
      '/dicionario?busca=Fertilidade',
    )
    cy.get('[data-cy=busca-item][data-tipo=tratamento] a').should(
      'have.attr',
      'href',
      '/tratamentos',
    )
  })

  it('mostra mensagem quando não há resultados', () => {
    cy.intercept('GET', ROTA, { body: [] }).as('buscar')
    visitarBusca('/busca?q=zzzznaoexiste')
    cy.wait('@buscar')
    cy.get('[data-cy=busca-vazia]')
      .should('be.visible')
      .and('contain', 'Nada encontrado')
  })

  it('exibe erro quando a busca falha', () => {
    cy.intercept('GET', ROTA, { statusCode: 500, body: {} }).as('falha')
    visitarBusca('/busca?q=fertil')
    cy.wait('@falha')
    cy.get('[data-cy=busca-erro]')
      .should('be.visible')
      .and('contain', 'Não foi possível buscar no momento.')
  })

  it('a busca do cabeçalho navega para /busca com o termo', () => {
    cy.intercept('GET', ROTA, { body: [] }).as('buscar')
    visitarBusca('/busca?q=inicial')
    cy.wait('@buscar')
    cy.get('[data-cy=app-search-input]').type('gravidez{enter}')
    cy.location('pathname').should('eq', '/busca')
    cy.location('search').should('contain', 'q=gravidez')
    cy.wait('@buscar')
  })

  it('sem termo, oferece orientação de uso', () => {
    // Termo vazio nem chega à API (a página resolve direto para vazio).
    visitarBusca('/busca')
    cy.get('[data-cy=busca-vazia]')
      .should('be.visible')
      .and('contain', 'Nenhum termo buscado ainda.')
  })
})
