// Suite de testes da página /calendario (Consultas) e do banner de próxima
// consulta na Home. Cobre os cenários BDD da história PROJ-1.

const ROTA_LISTA = '**/api/consultas/'
const ROTA_PROXIMAS = '**/api/consultas/proximas/'

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

const consultasMock = [
  {
    id: 1,
    data_horario: '2026-05-27T17:30:00Z',
    local: 'Clínica Amare - Sala 3',
    observacoes: 'Trazer exames de sangue da última semana.',
    status: 'agendada',
    status_label: 'Agendada',
    especialidade: 1,
    especialidade_nome: 'Reprodução humana',
    medica: 1,
    medica_nome: 'Dra. Helena Costa',
  },
  {
    id: 2,
    data_horario: '2026-05-30T12:00:00Z',
    local: 'Clínica Amare - Sala 1',
    observacoes: 'Jejum de 8 horas antes do exame.',
    status: 'agendada',
    status_label: 'Agendada',
    especialidade: 2,
    especialidade_nome: 'Endocrinologia',
    medica: null,
    medica_nome: '',
  },
  {
    id: 3,
    data_horario: '2026-05-15T19:00:00Z',
    local: 'Clínica Amare - Sala 3',
    observacoes: 'Resultado do beta-hCG conversado.',
    status: 'realizada',
    status_label: 'Realizada',
    especialidade: 1,
    especialidade_nome: 'Reprodução humana',
    medica: 1,
    medica_nome: 'Dra. Helena Costa',
  },
  {
    id: 4,
    data_horario: '2026-05-22T13:00:00Z',
    local: 'Online (videochamada)',
    observacoes: 'Cancelada pela clínica - será reagendada.',
    status: 'cancelada',
    status_label: 'Cancelada',
    especialidade: 3,
    especialidade_nome: 'Psicologia',
    medica: null,
    medica_nome: '',
  },
]

const proximasMock = [consultasMock[0], consultasMock[1]]

function visitarConsultas(rota = '/calendario') {
  return cy.visit(rota, {
    onBeforeLoad(janela) {
      janela.localStorage.setItem('marea_auth', JSON.stringify(SESSAO_FAKE))
    },
  })
}

describe('Calendário de consultas da Amare', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
  })

  it('exibe o título e o cabeçalho da página', () => {
    cy.intercept('GET', ROTA_LISTA, { body: consultasMock }).as('listar')
    visitarConsultas()
    cy.wait('@listar')
    cy.get('[data-cy=page-calendario]').should('be.visible')
    cy.contains('h1', 'Calendário de consultas').should('be.visible')
  })

  it('mostra a lista de consultas agrupada por status (cenário BDD: visualizar)', () => {
    cy.intercept('GET', ROTA_LISTA, { body: consultasMock }).as('listar')
    visitarConsultas()
    cy.wait('@listar')

    cy.get('[data-cy=consultas-card]').should('have.length', 4)
    cy.get('[data-cy=consultas-grupo-proximas]')
      .should('be.visible')
      .find('[data-cy=consultas-card]')
      .should('have.length', 2)
    cy.get('[data-cy=consultas-grupo-realizadas]')
      .should('be.visible')
      .find('[data-cy=consultas-card]')
      .should('have.length', 1)
    cy.get('[data-cy=consultas-grupo-canceladas]')
      .should('be.visible')
      .find('[data-cy=consultas-card]')
      .should('have.length', 1)
  })

  it('exibe mensagem amigável quando não há consultas (cenário BDD: nenhuma)', () => {
    cy.intercept('GET', ROTA_LISTA, { body: [] }).as('listar')
    visitarConsultas()
    cy.wait('@listar')
    cy.get('[data-cy=consultas-mensagem-vazia]')
      .should('be.visible')
      .and('contain', 'Você ainda não tem consultas cadastradas')
    cy.get('[data-cy=consultas-card]').should('not.exist')
  })

  it('exibe mensagem de erro acessível quando a API falha', () => {
    cy.intercept('GET', ROTA_LISTA, { statusCode: 500, body: {} }).as('falha')
    visitarConsultas()
    cy.wait('@falha')
    cy.get('[data-cy=consultas-mensagem-erro]')
      .should('be.visible')
      .and('have.attr', 'role', 'alert')
      .and('contain', 'Não foi possível carregar suas consultas no momento.')
  })

  it('cada card mostra data, especialidade, médica e status', () => {
    cy.intercept('GET', ROTA_LISTA, { body: consultasMock }).as('listar')
    visitarConsultas()
    cy.wait('@listar')

    cy.get('[data-cy=consultas-grupo-proximas]')
      .find('[data-cy=consultas-card]')
      .first()
      .within(() => {
        cy.get('[data-cy=consultas-card-data]').should('be.visible')
        cy.get('[data-cy=consultas-card-especialidade]')
          .should('be.visible')
          .and('contain', 'Reprodução humana')
        cy.get('[data-cy=consultas-card-medica]').should(
          'contain',
          'Dra. Helena Costa',
        )
        cy.get('[data-cy=consultas-card-status]')
          .should('be.visible')
          .and('contain', 'Agendada')
      })
  })

  it('quando a consulta não tem médica associada, mostra "Profissional a confirmar"', () => {
    cy.intercept('GET', ROTA_LISTA, { body: [consultasMock[1]] }).as('listar')
    visitarConsultas()
    cy.wait('@listar')

    cy.get('[data-cy=consultas-card]')
      .first()
      .find('[data-cy=consultas-card-medica]')
      .should('contain', 'Profissional a confirmar')
  })
})

describe('Banner de próxima consulta na Home', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
  })

  it('renderiza com data, especialidade e médica quando há próxima consulta', () => {
    cy.intercept('GET', ROTA_PROXIMAS, { body: proximasMock }).as('proximas')
    visitarConsultas('/')
    cy.wait('@proximas')

    cy.get('[data-cy=banner-proxima-consulta]')
      .should('be.visible')
      .within(() => {
        cy.contains('Próxima consulta').should('be.visible')
        cy.contains('Reprodução humana').should('be.visible')
        cy.contains('Dra. Helena Costa').should('be.visible')
      })

    cy.get('[data-cy=banner-proxima-consulta-restantes]')
      .should('be.visible')
      .and('contain', '+1 outra consulta')
    cy.get('[data-cy=banner-proxima-consulta-link]').should(
      'have.attr',
      'href',
      '/calendario',
    )
  })

  it('não aparece quando a API de próximas retorna lista vazia', () => {
    cy.intercept('GET', ROTA_PROXIMAS, { body: [] }).as('proximas')
    visitarConsultas('/')
    cy.wait('@proximas')

    cy.get('[data-cy=home-page]').should('be.visible')
    cy.get('[data-cy=banner-proxima-consulta]').should('not.exist')
  })
})
