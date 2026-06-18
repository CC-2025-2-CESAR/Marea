// Menu da conta no cabeçalho (HeaderProfileMenu): atalhos por papel + ações de
// conta, acessível por clique/teclado, fechando em Escape e clique-fora. No
// mobile ele some — a navegação e o "Sair" vivem no drawer.

const SESSAO_PACIENTE = {
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

const SESSAO_MEDICA = {
  access: 'token-de-acesso-fake',
  refresh: 'token-de-refresh-fake',
  usuario: {
    id: 2,
    username: 'medica_teste',
    email: 'medica@amare.test',
    tipo_usuario: 'medica',
    nome_completo: 'Dra. Helena Costa',
  },
}

function mocksComuns() {
  cy.intercept('GET', '**/api/consultas/proximas/', { body: [] })
  cy.intercept('GET', '**/api/consultas/', { body: [] })
  cy.intercept('GET', '**/api/medicamentos/', { body: [] })
  cy.intercept('GET', '**/api/ciclo/**', { body: [] })
  cy.intercept('GET', '**/api/sintomas/', { body: [] })
  cy.intercept('GET', '**/api/jornada/', { body: [] })
  cy.intercept('GET', '**/api/dicionario/termos/**', { body: [] })
  cy.intercept('GET', '**/api/perfil/', {
    body: {
      username: 'paciente_teste',
      email: 'paciente@amare.test',
      tipo_usuario: 'paciente',
      nome_completo: 'Júlia Pereira',
    },
  })
}

function visitar(rota, sessao = SESSAO_PACIENTE) {
  cy.visit(rota, {
    onBeforeLoad(janela) {
      janela.localStorage.setItem('marea_auth', JSON.stringify(sessao))
    },
  })
}

describe('Menu da conta no cabecalho', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    mocksComuns()
  })

  it('abre pelo gatilho e mostra atalhos da paciente + acoes de conta', () => {
    visitar('/')
    cy.get('[data-cy=header-perfil-painel]').should('not.exist')

    cy.get('[data-cy=header-perfil-gatilho]').click()
    cy.get('[data-cy=header-perfil-painel]').should('be.visible')
    cy.get('[data-cy=header-perfil-ciclo]').should('be.visible')
    cy.get('[data-cy=header-perfil-medicamentos]').should('be.visible')
    cy.get('[data-cy=header-perfil-linha-do-tempo]').should('be.visible')
    cy.get('[data-cy=header-perfil-sintomas]').should('be.visible')
    cy.get('[data-cy=header-perfil-perfil]').should('be.visible')
    cy.get('[data-cy=header-perfil-meus-dados]').should('be.visible')
    cy.get('[data-cy=header-perfil-privacidade]').should('be.visible')
    cy.get('[data-cy=header-perfil-sair]').should('be.visible')
  })

  it('um atalho do menu navega para a rota', () => {
    visitar('/')
    cy.get('[data-cy=header-perfil-gatilho]').click()
    cy.get('[data-cy=header-perfil-ciclo]').click()
    cy.location('pathname').should('eq', '/ciclo')
  })

  it('Escape fecha o menu', () => {
    visitar('/')
    cy.get('[data-cy=header-perfil-gatilho]').click()
    cy.get('[data-cy=header-perfil-painel]').should('be.visible')
    cy.get('[data-cy=header-perfil-gatilho]').type('{esc}')
    cy.get('[data-cy=header-perfil-painel]').should('not.exist')
  })

  it('clicar fora fecha o menu', () => {
    visitar('/')
    cy.get('[data-cy=header-perfil-gatilho]').click()
    cy.get('[data-cy=header-perfil-painel]').should('be.visible')
    cy.get('[data-cy=home-saudacao]').click()
    cy.get('[data-cy=header-perfil-painel]').should('not.exist')
  })

  it('Sair desloga e volta para /login', () => {
    visitar('/')
    cy.get('[data-cy=header-perfil-gatilho]').click()
    cy.get('[data-cy=header-perfil-sair]').click()
    cy.location('pathname').should('eq', '/login')
    cy.window().its('localStorage.marea_auth').should('be.undefined')
  })

  it('para a medica, mostra so a area dela + Sair (sem atalhos da paciente)', () => {
    visitar('/dicionario', SESSAO_MEDICA)
    cy.get('[data-cy=header-perfil-gatilho]').click()
    cy.get('[data-cy=header-perfil-pacientes]').should('be.visible')
    cy.get('[data-cy=header-perfil-sair]').should('be.visible')
    cy.get('[data-cy=header-perfil-ciclo]').should('not.exist')
  })

  it('no mobile o menu da conta nao aparece (fica no drawer)', () => {
    cy.viewport(390, 844)
    visitar('/')
    cy.get('[data-cy=header-perfil-gatilho]').should('not.be.visible')
  })
})
