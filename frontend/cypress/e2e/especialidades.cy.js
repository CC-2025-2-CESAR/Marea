const ROTA_LISTA = '**/api/especialidades/**'

// A página /especialidades vive dentro do AppLayout protegido, então todo
// cy.visit precisa de uma sessão fake no localStorage. O conteúdo é público
// no backend.
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

function visitarEspecialidades(rota = '/especialidades') {
  return cy.visit(rota, {
    onBeforeLoad(janela) {
      janela.localStorage.setItem('marea_auth', JSON.stringify(SESSAO_FAKE))
    },
  })
}

const especialidadesMock = [
  {
    id: 1,
    nome: 'Reprodução humana',
    descricao:
      'Acompanhamento de fertilidade e tratamentos de reprodução assistida.',
    medicas: [
      {
        id: 1,
        nome: 'Dra. Helena Costa',
        especialidade: 'Reprodução Assistida',
        crm: 'CRM/PE 12345',
        rqe: '12206',
        bio: 'Apresentação da médica.',
      },
    ],
  },
  {
    id: 2,
    nome: 'Psicologia',
    descricao: 'Apoio emocional durante o tratamento.',
    medicas: [],
  },
]

describe('Especialidades da Amare', () => {
  it('exibe o título da página', () => {
    cy.intercept('GET', ROTA_LISTA, { body: especialidadesMock }).as('listar')
    visitarEspecialidades()
    cy.wait('@listar')
    cy.get('[data-cy=page-especialidades]').should('be.visible')
    cy.contains('h1', 'Especialidades').should('be.visible')
  })

  it('mostra o grid de especialidades quando a API retorna dados', () => {
    cy.intercept('GET', ROTA_LISTA, { body: especialidadesMock }).as('listar')
    visitarEspecialidades()
    cy.wait('@listar')
    cy.get('[data-cy=especialidades-grid]').should('be.visible')
    cy.get('[data-cy=especialidades-card]').should('have.length', 2)
    cy.get('[data-cy=especialidades-grid]')
      .should('contain', 'Reprodução humana')
      .and('contain', 'Psicologia')
  })

  it('mostra a descrição e as médicas relacionadas', () => {
    cy.intercept('GET', ROTA_LISTA, { body: especialidadesMock }).as('listar')
    visitarEspecialidades()
    cy.wait('@listar')

    cy.get('[data-cy=especialidades-card]')
      .filter(':contains("Reprodução humana")')
      .within(() => {
        cy.contains('h2', 'Reprodução humana').should('be.visible')
        cy.contains(
          'Acompanhamento de fertilidade e tratamentos de reprodução assistida.',
        ).should('be.visible')
        cy.get('[data-cy=especialidades-card-medicas]')
          .should('contain', 'Médicas relacionadas')
          .and('contain', 'Dra. Helena Costa')
      })
  })

  it('não mostra a seção de médicas quando não há médicas relacionadas', () => {
    cy.intercept('GET', ROTA_LISTA, { body: especialidadesMock }).as('listar')
    visitarEspecialidades()
    cy.wait('@listar')

    cy.get('[data-cy=especialidades-card]')
      .filter(':contains("Psicologia")')
      .within(() => {
        cy.get('[data-cy=especialidades-card-medicas]').should('not.exist')
      })
  })

  it('exibe mensagem quando a API retorna lista vazia', () => {
    cy.intercept('GET', ROTA_LISTA, { body: [] }).as('listar')
    visitarEspecialidades()
    cy.wait('@listar')
    cy.get('[data-cy=especialidades-mensagem-vazia]')
      .should('be.visible')
      .and('contain', 'Nenhuma especialidade cadastrada no momento.')
  })

  it('exibe mensagem de erro quando a API falha', () => {
    cy.intercept('GET', ROTA_LISTA, { statusCode: 500, body: {} }).as('falha')
    visitarEspecialidades()
    cy.wait('@falha')
    cy.get('[data-cy=especialidades-mensagem-erro]')
      .should('be.visible')
      .and('contain', 'Não foi possível carregar as especialidades no momento.')
  })
})

describe('Detalhe da especialidade', () => {
  // Padrões exatos: o da lista NÃO casa com /1/ e o de detalhe NÃO casa com a
  // lista, então os dois interceptam endpoints disjuntos sem ambiguidade.
  const ROTA_LISTA_EXATA = '**/api/especialidades/'
  const ROTA_DETALHE_1 = '**/api/especialidades/1/'
  const ROTA_DETALHE_2 = '**/api/especialidades/2/'
  const ROTA_DETALHE_999 = '**/api/especialidades/999/'

  it('abre o detalhe ao clicar no card da listagem', () => {
    cy.intercept('GET', ROTA_LISTA_EXATA, { body: especialidadesMock }).as(
      'listar',
    )
    cy.intercept('GET', ROTA_DETALHE_1, { body: especialidadesMock[0] }).as(
      'detalhar',
    )
    visitarEspecialidades()
    cy.wait('@listar')

    cy.get('[data-cy=especialidades-card]')
      .filter(':contains("Reprodução humana")')
      .find('a')
      .click()

    cy.wait('@detalhar')
    cy.location('pathname').should('eq', '/especialidades/1')
    cy.get('[data-cy=page-especialidade-detalhe]').should('be.visible')
    cy.get('[data-cy=especialidade-detalhe-titulo]').should(
      'contain',
      'Reprodução humana',
    )
    cy.get('[data-cy=especialidade-detalhe-medicas]')
      .should('contain', 'Médicas relacionadas')
      .and('contain', 'Dra. Helena Costa')
    // Perfil enriquecido (PR8): especialidade + registros profissionais.
    cy.get('[data-cy=especialidade-detalhe-medica]')
      .should('contain', 'Reprodução Assistida')
      .and('contain', 'CRM/PE 12345')
      .and('contain', 'RQE 12206')
  })

  it('acessa o detalhe diretamente pela URL', () => {
    cy.intercept('GET', ROTA_DETALHE_1, { body: especialidadesMock[0] }).as(
      'detalhar',
    )
    visitarEspecialidades('/especialidades/1')
    cy.wait('@detalhar')
    cy.get('[data-cy=especialidade-detalhe-titulo]').should(
      'contain',
      'Reprodução humana',
    )
    cy.get('[data-cy=especialidade-detalhe-descricao]').should('be.visible')
  })

  it('não mostra a seção de médicas quando a especialidade não tem médicas', () => {
    cy.intercept('GET', ROTA_DETALHE_2, { body: especialidadesMock[1] }).as(
      'detalhar',
    )
    visitarEspecialidades('/especialidades/2')
    cy.wait('@detalhar')
    cy.get('[data-cy=especialidade-detalhe-titulo]').should(
      'contain',
      'Psicologia',
    )
    cy.get('[data-cy=especialidade-detalhe-medicas]').should('not.exist')
  })

  it('mostra o estado de não encontrado quando a API responde 404', () => {
    cy.intercept('GET', ROTA_DETALHE_999, {
      statusCode: 404,
      body: { detail: 'Especialidade não encontrada.' },
    }).as('detalhar')
    visitarEspecialidades('/especialidades/999')
    cy.wait('@detalhar')
    cy.get('[data-cy=especialidade-detalhe-nao-encontrado]').should(
      'be.visible',
    )
  })

  it('volta para a listagem pelo link de voltar', () => {
    cy.intercept('GET', ROTA_LISTA_EXATA, { body: especialidadesMock }).as(
      'listar',
    )
    cy.intercept('GET', ROTA_DETALHE_1, { body: especialidadesMock[0] }).as(
      'detalhar',
    )
    visitarEspecialidades('/especialidades/1')
    cy.wait('@detalhar')
    cy.get('[data-cy=especialidade-detalhe-voltar]').click()
    cy.wait('@listar')
    cy.location('pathname').should('eq', '/especialidades')
    cy.get('[data-cy=page-especialidades]').should('be.visible')
  })
})
