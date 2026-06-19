const ROTA_EQUIPE = '**/api/equipe-medica/'

// A pagina /equipe-medica vive dentro do AppLayout protegido, entao todo
// cy.visit precisa de uma sessao fake no localStorage. O conteudo e publico
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

function visitarEquipe(rota = '/equipe-medica') {
  return cy.visit(rota, {
    onBeforeLoad(janela) {
      janela.localStorage.setItem('marea_auth', JSON.stringify(SESSAO_FAKE))
    },
  })
}

const equipeMock = [
  {
    id: 1,
    nome: 'Adriana Leal Griz Notaro',
    especialidade: 'Reprodução Assistida',
    crm: 'CRM/PE 17733',
    rqe: '12206',
    bio: 'Médica especialista em Reprodução Assistida.',
    especialidades: [{ id: 1, nome: 'Reprodução humana' }],
  },
  {
    id: 2,
    nome: 'Ana Caroline Paz Serafim',
    especialidade: 'Videocirurgia Ginecológica',
    crm: 'CRM/PE 17536',
    rqe: '1194',
    bio: 'Médica especialista em Videocirurgia Ginecológica.',
    especialidades: [
      { id: 2, nome: 'Cirurgia Ginecológica' },
      { id: 3, nome: 'Ginecologia' },
    ],
  },
]

describe('Equipe médica da Amare', () => {
  it('exibe o título da página', () => {
    cy.intercept('GET', ROTA_EQUIPE, { body: equipeMock }).as('listar')
    visitarEquipe()
    cy.wait('@listar')
    cy.get('[data-cy=page-equipe-medica]').should('be.visible')
    cy.contains('h1', 'Equipe médica').should('be.visible')
  })

  it('mostra o grid com as médicas quando a API retorna dados', () => {
    cy.intercept('GET', ROTA_EQUIPE, { body: equipeMock }).as('listar')
    visitarEquipe()
    cy.wait('@listar')
    cy.get('[data-cy=equipe-medica-grid]').should('be.visible')
    cy.get('[data-cy=equipe-medica-card]').should('have.length', 2)
    cy.get('[data-cy=equipe-medica-grid]')
      .should('contain', 'Adriana Leal Griz Notaro')
      .and('contain', 'Ana Caroline Paz Serafim')
  })

  it('mostra especialidade, registros e áreas de atuação', () => {
    cy.intercept('GET', ROTA_EQUIPE, { body: equipeMock }).as('listar')
    visitarEquipe()
    cy.wait('@listar')

    cy.get('[data-cy=equipe-medica-card]')
      .filter(':contains("Adriana Leal Griz Notaro")')
      .within(() => {
        cy.contains('Reprodução Assistida').should('be.visible')
        cy.contains('CRM/PE 17733').should('be.visible')
        cy.contains('RQE 12206').should('be.visible')
        cy.contains('Reprodução humana').should('be.visible')
      })
  })

  it('exibe mensagem quando a API retorna lista vazia', () => {
    cy.intercept('GET', ROTA_EQUIPE, { body: [] }).as('listar')
    visitarEquipe()
    cy.wait('@listar')
    cy.get('[data-cy=equipe-medica-mensagem-vazia]')
      .should('be.visible')
      .and('contain', 'Nenhuma médica cadastrada no momento.')
  })

  it('exibe mensagem de erro quando a API falha', () => {
    cy.intercept('GET', ROTA_EQUIPE, { statusCode: 500, body: {} }).as('falha')
    visitarEquipe()
    cy.wait('@falha')
    cy.get('[data-cy=equipe-medica-mensagem-erro]')
      .should('be.visible')
      .and('contain', 'Não foi possível carregar a equipe médica no momento.')
  })
})
