// Suíte dedicada aos detalhes de polimento de UX da iteração 5:
// transição entre rotas, SelectField customizado de tipo sanguíneo e
// máscara de telefone. Mocka GET/PATCH /api/perfil/ e mantém o arquivo
// autônomo (sem depender de perfil.cy.js).

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

  it('2. SelectField de tipo sanguineo abre a lista ao clicar', () => {
    visitarPerfilAutenticado()
    cy.get('[role=listbox]').should('not.exist')
    cy.get('[data-cy=perfil-tipo-sanguineo]').click()
    cy.get('[role=listbox]').should('be.visible')
    cy.get('[data-cy=perfil-tipo-sanguineo-opcao-A-]').should('be.visible')
  })

  it('3. clicar em uma opcao atualiza o valor e fecha a lista', () => {
    visitarPerfilAutenticado()
    cy.get('[data-cy=perfil-tipo-sanguineo]').click()
    cy.get('[data-cy=perfil-tipo-sanguineo-opcao-AB-]').click()
    cy.get('[role=listbox]').should('not.exist')
    cy.get('[data-cy=perfil-tipo-sanguineo]').should('contain', 'AB-')
  })

  it('4. apertar Esc fecha o SelectField', () => {
    visitarPerfilAutenticado()
    cy.get('[data-cy=perfil-tipo-sanguineo]').click()
    cy.get('[role=listbox]').should('be.visible')
    cy.get('[data-cy=perfil-tipo-sanguineo]').type('{esc}')
    cy.get('[role=listbox]').should('not.exist')
  })

  it('5. clicar fora fecha o SelectField', () => {
    visitarPerfilAutenticado()
    cy.get('[data-cy=perfil-tipo-sanguineo]').click()
    cy.get('[role=listbox]').should('be.visible')
    cy.get('h1').contains('Perfil').click()
    cy.get('[role=listbox]').should('not.exist')
  })

  it('6. navegar com seta para baixo e Enter seleciona a proxima opcao', () => {
    visitarPerfilAutenticado()
    // Valor inicial é O+. Abrir com clique, depois descer uma opção
    // (vai para O-) e confirmar com Enter.
    cy.get('[data-cy=perfil-tipo-sanguineo]').click()
    cy.get('[role=listbox]').should('be.visible')
    cy.get('[data-cy=perfil-tipo-sanguineo]')
      .type('{downarrow}', { force: true })
      .type('{enter}', { force: true })
    cy.get('[role=listbox]').should('not.exist')
    cy.get('[data-cy=perfil-tipo-sanguineo]').should('contain', 'O-')
  })

  it('7. campo telefone ignora letras digitadas', () => {
    visitarPerfilAutenticado()
    cy.get('[data-cy=perfil-telefone]').clear().type('abc')
    cy.get('[data-cy=perfil-telefone]').should('have.value', '')
  })

  it('8. campo telefone aplica mascara com 11 digitos', () => {
    visitarPerfilAutenticado()
    cy.get('[data-cy=perfil-telefone]').clear().type('81999998888')
    cy.get('[data-cy=perfil-telefone]').should('have.value', '(81) 99999-8888')
  })

  it('9. campo telefone respeita o limite de 11 digitos', () => {
    visitarPerfilAutenticado()
    cy.get('[data-cy=perfil-telefone]').clear().type('819999988880000')
    cy.get('[data-cy=perfil-telefone]').should('have.value', '(81) 99999-8888')
  })

  it('10. salvar perfil com telefone formatado dispara feedback de sucesso', () => {
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
