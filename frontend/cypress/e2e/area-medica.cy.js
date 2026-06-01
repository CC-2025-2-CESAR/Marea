// Controle de acesso por papel: a médica tem a própria área (/area-medica),
// separada da área da paciente. Cobre o redirecionamento nos dois sentidos e
// o logout. Mocks defensivos cobrem a área da paciente caso ela renderize.

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

function visitarComo(sessao, rota) {
  return cy.visit(rota, {
    onBeforeLoad(janela) {
      janela.localStorage.setItem('marea_auth', JSON.stringify(sessao))
    },
  })
}

describe('Área da médica e controle de acesso por papel', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    // Mocks defensivos: se a área da paciente chegar a renderizar, não bate
    // no backend real.
    cy.intercept('GET', '**/api/consultas/proximas/', { body: [] })
    cy.intercept('GET', '**/api/consultas/', { body: [] })
    cy.intercept('GET', '**/api/medicamentos/', { body: [] })
    cy.intercept('GET', '**/api/perfil/', { body: {} })
  })

  it('médica é levada para /area-medica ao acessar a raiz', () => {
    visitarComo(SESSAO_MEDICA, '/')
    cy.location('pathname').should('eq', '/area-medica')
    cy.get('[data-cy=page-area-medica]').should('be.visible')
    cy.contains('Área da médica').should('be.visible')
  })

  it('médica não acessa a página de perfil da paciente', () => {
    visitarComo(SESSAO_MEDICA, '/perfil')
    cy.location('pathname').should('eq', '/area-medica')
    cy.get('[data-cy=page-perfil]').should('not.exist')
  })

  it('paciente não acessa a área da médica', () => {
    visitarComo(SESSAO_PACIENTE, '/area-medica')
    cy.location('pathname').should('eq', '/')
    cy.get('[data-cy=page-area-medica]').should('not.exist')
  })

  it('médica consegue sair pela área dela', () => {
    visitarComo(SESSAO_MEDICA, '/area-medica')
    cy.get('[data-cy=area-medica-logout]').click()
    cy.location('pathname').should('eq', '/login')
    cy.window().its('localStorage.marea_auth').should('be.undefined')
  })
})
