// Suite dedicada a validar a experiencia mobile da Amare. Roda em viewports
// pequenos (iPhone 12 / Pixel 7 / iPad Mini) sem afetar a suite original,
// que continua em 1280x720.

const VIEWPORT_IPHONE_12 = { largura: 390, altura: 844 }
const VIEWPORT_PIXEL_7 = { largura: 412, altura: 915 }
const VIEWPORT_IPAD_MINI = { largura: 768, altura: 1024 }

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

const PERFIL_MOCK = {
  username: 'paciente_teste',
  email: 'paciente@amare.test',
  tipo_usuario: 'paciente',
  nome_completo: 'Júlia Pereira',
  telefone: '(81) 91234-5678',
  foto_url: '',
  data_nascimento: '1993-04-12',
  tipo_sanguineo: 'O+',
  medicamentos_em_uso: 'Ácido fólico 5mg, uma vez ao dia.',
  observacoes_medicas: 'Em acompanhamento para indução da ovulação.',
}

const TERMOS_MOCK = [
  {
    id: 1,
    termo: 'FIV',
    definicao: 'Sigla de Fertilização in Vitro.',
    categoria: 'Procedimento',
    exemplo: '',
    artigos_relacionados: [],
  },
  {
    id: 2,
    termo: 'Endometriose',
    definicao: 'Condição em que o tecido cresce fora do útero.',
    categoria: 'Doença',
    exemplo: '',
    artigos_relacionados: [],
  },
  {
    id: 3,
    termo: 'Progesterona',
    definicao: 'Hormônio importante na fase final do ciclo.',
    categoria: 'Remédio',
    exemplo: '',
    artigos_relacionados: [],
  },
]

function viewportMobile(viewport = VIEWPORT_IPHONE_12) {
  cy.viewport(viewport.largura, viewport.altura)
}

function visitarAutenticadoMobile(rota, viewport = VIEWPORT_IPHONE_12) {
  viewportMobile(viewport)
  cy.intercept('GET', '**/api/perfil/', { body: PERFIL_MOCK }).as('perfil')
  cy.intercept('GET', '**/api/dicionario/termos/**', {
    body: TERMOS_MOCK,
  }).as('termos')
  cy.intercept('GET', '**/api/consultas/proximas/', { body: [] })
  cy.intercept('GET', '**/api/consultas/', { body: [] })
  cy.intercept('GET', '**/api/medicamentos/', { body: [] })
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

describe('Responsividade mobile da Amare', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
  })

  it('1. /login carrega em viewport iPhone 12 sem scroll horizontal', () => {
    viewportMobile()
    cy.visit('/login')
    cy.get('[data-cy=amare-logo]').should('be.visible')
    cy.get('[data-cy=login-submit]').should('be.visible')
    semScrollHorizontal()
  })

  it('2. Login mobile mostra campos e botao acessiveis ao toque', () => {
    viewportMobile(VIEWPORT_PIXEL_7)
    cy.visit('/login')
    cy.get('[data-cy=login-username]').should('be.visible')
    cy.get('[data-cy=login-password]').should('be.visible')
    cy.get('[data-cy=login-submit]')
      .should('be.visible')
      .then(($botao) => {
        expect($botao[0].getBoundingClientRect().height).to.be.gte(44)
      })
  })

  it('3. Header mobile mostra botao de menu e esconde a sidebar lateral', () => {
    visitarAutenticadoMobile('/perfil')
    cy.wait('@perfil')
    cy.get('[data-cy=nav-abrir-drawer]').should('be.visible')
    // A sidebar do AppLayout existe no DOM mas fica escondida via CSS.
    cy.get('[data-cy=app-sidebar]').should('not.be.visible')
    cy.get('[data-cy=app-layout-drawer]').should('not.exist')
  })

  it('4. Tocar no botao de menu abre o drawer com a sidebar', () => {
    visitarAutenticadoMobile('/perfil')
    cy.wait('@perfil')
    cy.get('[data-cy=nav-abrir-drawer]').click()
    cy.get('[data-cy=app-layout-drawer]').should('be.visible')
    cy.get('[data-cy=app-layout-backdrop]').should('be.visible')
    cy.get('[data-cy=app-layout-drawer] [data-cy=nav-perfil]').should(
      'be.visible',
    )
  })

  it('5. Tocar num link do drawer navega e fecha o drawer', () => {
    visitarAutenticadoMobile('/perfil')
    cy.wait('@perfil')
    cy.get('[data-cy=nav-abrir-drawer]').click()
    cy.get('[data-cy=app-layout-drawer] [data-cy=nav-dicionario]').click()
    cy.location('pathname').should('eq', '/dicionario')
    cy.get('[data-cy=app-layout-drawer]').should('not.exist')
  })

  it('6. Tocar no backdrop fecha o drawer', () => {
    visitarAutenticadoMobile('/perfil')
    cy.wait('@perfil')
    cy.get('[data-cy=nav-abrir-drawer]').click()
    cy.get('[data-cy=app-layout-backdrop]').click({ force: true })
    cy.get('[data-cy=app-layout-drawer]').should('not.exist')
  })

  it('7. Apertar Esc fecha o drawer', () => {
    visitarAutenticadoMobile('/perfil')
    cy.wait('@perfil')
    cy.get('[data-cy=nav-abrir-drawer]').click()
    cy.get('[data-cy=app-layout-drawer]').should('be.visible')
    cy.get('body').type('{esc}')
    cy.get('[data-cy=app-layout-drawer]').should('not.exist')
  })

  it('8. Botao Sair dentro do drawer faz logout e volta para /login', () => {
    visitarAutenticadoMobile('/perfil')
    cy.wait('@perfil')
    cy.get('[data-cy=nav-abrir-drawer]').click()
    cy.get('[data-cy=app-layout-drawer] [data-cy=nav-logout]').click()
    cy.location('pathname').should('eq', '/login')
    cy.window().its('localStorage.marea_auth').should('be.undefined')
  })

  it('9. /perfil em mobile carrega sem scroll horizontal', () => {
    visitarAutenticadoMobile('/perfil')
    cy.wait('@perfil')
    cy.get('[data-cy=page-perfil]').should('be.visible')
    cy.get('[data-cy=perfil-nome]').should('be.visible')
    semScrollHorizontal()
  })

  it('10. /dicionario em mobile mostra cards em uma coluna sem scroll horizontal', () => {
    visitarAutenticadoMobile('/dicionario')
    cy.wait('@termos')
    cy.get('[data-cy=dicionario-grid]').should('be.visible')
    cy.get('[data-cy=dicionario-card]').should('have.length.greaterThan', 0)
    semScrollHorizontal()
  })

  it('11. Em viewport tablet (iPad Mini, 768px) a sidebar lateral volta a aparecer', () => {
    visitarAutenticadoMobile('/perfil', VIEWPORT_IPAD_MINI)
    cy.wait('@perfil')
    cy.get('[data-cy=app-sidebar]').should('be.visible')
    // O botao existe no DOM mas o CSS o esconde acima de 768px.
    cy.get('[data-cy=nav-abrir-drawer]').should('not.be.visible')
  })
})
