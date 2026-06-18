// Segurança da conta: abrir o modal de troca de senha a partir do perfil,
// validar a confirmação no cliente e tratar sucesso/erro da API.

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
  medicamentos_em_uso: '',
  observacoes_medicas: '',
}

function visitarPerfil() {
  cy.intercept('GET', '**/api/perfil/', { body: PERFIL_MOCK }).as('perfil')
  cy.intercept('GET', '**/api/sintomas/', { body: [] })
  cy.intercept('GET', '**/api/ciclo/registros/', { body: [] })
  cy.visit('/perfil', {
    onBeforeLoad(janela) {
      janela.localStorage.setItem('marea_auth', JSON.stringify(SESSAO_FAKE))
    },
  })
  cy.wait('@perfil')
}

describe('Segurança da conta — alterar senha', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
  })

  it('abre o modal a partir da secao de seguranca', () => {
    visitarPerfil()
    cy.get('[data-cy=perfil-seguranca]').should('be.visible')
    cy.get('[data-cy=alterar-senha]').should('not.exist')
    cy.get('[data-cy=perfil-alterar-senha-abrir]').click()
    cy.get('[data-cy=alterar-senha]').should('be.visible')
    cy.get('[data-cy=alterar-senha-atual]').should('be.visible')
  })

  it('valida no cliente quando a confirmacao nao confere', () => {
    visitarPerfil()
    cy.get('[data-cy=perfil-alterar-senha-abrir]').click()
    cy.get('[data-cy=alterar-senha-atual]').type('PrimeiraChave2026')
    cy.get('[data-cy=alterar-senha-nova]').type('OutraChave2027!')
    cy.get('[data-cy=alterar-senha-confirmar]').type('Diferente2027!')
    cy.get('[data-cy=alterar-senha-salvar]').click()
    cy.get('[data-cy=alterar-senha-erro]')
      .should('be.visible')
      .and('contain', 'não conferem')
  })

  it('troca a senha com sucesso e mostra toast', () => {
    visitarPerfil()
    cy.intercept('POST', '**/api/auth/alterar-senha/', {
      statusCode: 200,
      body: { detail: 'Senha alterada com sucesso.' },
    }).as('alterar')

    cy.get('[data-cy=perfil-alterar-senha-abrir]').click()
    cy.get('[data-cy=alterar-senha-atual]').type('PrimeiraChave2026')
    cy.get('[data-cy=alterar-senha-nova]').type('OutraChave2027!')
    cy.get('[data-cy=alterar-senha-confirmar]').type('OutraChave2027!')
    cy.get('[data-cy=alterar-senha-salvar]').click()

    cy.wait('@alterar')
    cy.get('[data-cy=toast]')
      .should('be.visible')
      .and('contain', 'Senha alterada com sucesso.')
    cy.get('[data-cy=alterar-senha]').should('not.exist')
  })

  it('mostra a mensagem do backend quando a senha atual esta incorreta', () => {
    visitarPerfil()
    cy.intercept('POST', '**/api/auth/alterar-senha/', {
      statusCode: 400,
      body: { detail: 'Senha atual incorreta.' },
    }).as('alterar')

    cy.get('[data-cy=perfil-alterar-senha-abrir]').click()
    cy.get('[data-cy=alterar-senha-atual]').type('ChaveErrada1')
    cy.get('[data-cy=alterar-senha-nova]').type('OutraChave2027!')
    cy.get('[data-cy=alterar-senha-confirmar]').type('OutraChave2027!')
    cy.get('[data-cy=alterar-senha-salvar]').click()

    cy.wait('@alterar')
    cy.get('[data-cy=alterar-senha-erro]')
      .should('be.visible')
      .and('contain', 'Senha atual incorreta.')
    cy.get('[data-cy=alterar-senha]').should('be.visible')
  })

  it('fecha no Cancelar sem enviar nada', () => {
    visitarPerfil()
    cy.get('[data-cy=perfil-alterar-senha-abrir]').click()
    cy.get('[data-cy=alterar-senha-cancelar]').click()
    cy.get('[data-cy=alterar-senha]').should('not.exist')
  })
})
