// Suíte dedicada aos detalhes de polimento de UX do perfil: transição entre
// rotas e a máscara de telefone (com salvar). Mocka GET/PATCH /api/perfil/ e
// os registros de "Meus registros", mantendo o arquivo autônomo.

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
]

function mockarPerfil() {
  cy.intercept('GET', '**/api/perfil/', { body: PERFIL_MOCK }).as('perfil')
  cy.intercept('GET', '**/api/sintomas/', { body: [] }).as('sintomas')
  cy.intercept('GET', '**/api/ciclo/registros/', { body: [] }).as('ciclo')
}

function visitarPerfilAutenticado() {
  mockarPerfil()
  cy.visit('/perfil', {
    onBeforeLoad(janela) {
      janela.localStorage.setItem('marea_auth', JSON.stringify(SESSAO_FAKE))
    },
  })
  cy.wait('@perfil')
}

describe('Polimento UX do perfil', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
  })

  it('1. trocar de /perfil para /dicionario mantem a navegacao funcionando', () => {
    mockarPerfil()
    cy.intercept('GET', '**/api/dicionario/termos/**', { body: TERMOS_MOCK }).as(
      'termos',
    )
    cy.visit('/perfil', {
      onBeforeLoad(janela) {
        janela.localStorage.setItem('marea_auth', JSON.stringify(SESSAO_FAKE))
      },
    })
    cy.wait('@perfil')
    cy.get('[data-cy=page-perfil]').should('be.visible')

    cy.get('[data-cy=nav-dicionario]').click()
    cy.wait('@termos')
    cy.location('pathname').should('eq', '/dicionario')
    cy.get('[data-cy=page-perfil]').should('not.exist')
  })

  it('2. campo telefone ignora letras digitadas', () => {
    visitarPerfilAutenticado()
    cy.get('[data-cy=perfil-telefone]').clear().type('abc')
    cy.get('[data-cy=perfil-telefone]').should('have.value', '')
  })

  it('3. campo telefone aplica mascara com 11 digitos', () => {
    visitarPerfilAutenticado()
    cy.get('[data-cy=perfil-telefone]').clear().type('81999998888')
    cy.get('[data-cy=perfil-telefone]').should('have.value', '(81) 99999-8888')
  })

  it('4. campo telefone respeita o limite de 11 digitos', () => {
    visitarPerfilAutenticado()
    cy.get('[data-cy=perfil-telefone]').clear().type('819999988880000')
    cy.get('[data-cy=perfil-telefone]').should('have.value', '(81) 99999-8888')
  })

  it('5. salvar perfil com telefone formatado dispara feedback de sucesso', () => {
    mockarPerfil()
    cy.intercept('PATCH', '**/api/perfil/', (req) => {
      req.reply({
        statusCode: 200,
        body: { ...PERFIL_MOCK, telefone: '(81) 99999-7777' },
      })
    }).as('salvar')

    cy.visit('/perfil', {
      onBeforeLoad(janela) {
        janela.localStorage.setItem('marea_auth', JSON.stringify(SESSAO_FAKE))
      },
    })
    cy.wait('@perfil')

    cy.get('[data-cy=perfil-telefone]').clear().type('81999997777')
    cy.get('[data-cy=perfil-telefone]').should('have.value', '(81) 99999-7777')
    cy.get('[data-cy=perfil-salvar]').click()
    cy.wait('@salvar')
    cy.get('[data-cy=toast]')
      .should('be.visible')
      .and('contain', 'Perfil atualizado com sucesso.')
  })
})
