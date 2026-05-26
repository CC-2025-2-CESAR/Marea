// Suite de testes da página /medicamentos e do checklist de medicamentos.
// Cobre os cenários BDD da história PROJ-2.

const ROTA_LISTA = '**/api/medicamentos/'
const ROTA_TOMA_RE = /\/api\/medicamentos\/\d+\/toma\//

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

const medicamentosMock = [
  {
    id: 1,
    nome: 'Ácido fólico',
    dose: '1 comprimido 5mg',
    horario: '08:00:00',
    instrucoes: 'Tomar após o café da manhã.',
    tomado: false,
  },
  {
    id: 2,
    nome: 'Progesterona',
    dose: '1 cápsula 200mg',
    horario: '12:00:00',
    instrucoes: 'Via oral, sempre no mesmo horário.',
    tomado: true,
  },
  {
    id: 3,
    nome: 'Vitamina D',
    dose: '1 gota',
    horario: '19:00:00',
    instrucoes: 'Tomar junto com o jantar.',
    tomado: false,
  },
]

function visitarMedicamentos(rota = '/medicamentos') {
  return cy.visit(rota, {
    onBeforeLoad(janela) {
      janela.localStorage.setItem('marea_auth', JSON.stringify(SESSAO_FAKE))
    },
  })
}

describe('Checklist de medicamentos da Amare', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
  })

  it('exibe o título e o cabeçalho da página', () => {
    cy.intercept('GET', ROTA_LISTA, { body: medicamentosMock }).as('listar')
    visitarMedicamentos()
    cy.wait('@listar')
    cy.get('[data-cy=page-medicamentos]').should('be.visible')
    cy.contains('h1', 'Medicamentos').should('be.visible')
  })

  it('lista os medicamentos cadastrados (cenário BDD: visualizar)', () => {
    cy.intercept('GET', ROTA_LISTA, { body: medicamentosMock }).as('listar')
    visitarMedicamentos()
    cy.wait('@listar')

    cy.get('[data-cy=medicamentos-checklist]').should('be.visible')
    cy.get('[data-cy=medicamentos-item]').should('have.length', 3)
    cy.get('[data-cy=medicamentos-checklist]')
      .should('contain', 'Ácido fólico')
      .and('contain', 'Progesterona')
      .and('contain', 'Vitamina D')
  })

  it('exibe contador "X de Y tomados hoje"', () => {
    cy.intercept('GET', ROTA_LISTA, { body: medicamentosMock }).as('listar')
    visitarMedicamentos()
    cy.wait('@listar')

    cy.get('[data-cy=medicamentos-contador]')
      .should('be.visible')
      .and('contain', '1')
      .and('contain', '3')
      .and('contain', 'tomados hoje')
  })

  it('mostra cada item com dose, horário e instruções no modo completo', () => {
    cy.intercept('GET', ROTA_LISTA, { body: medicamentosMock }).as('listar')
    visitarMedicamentos()
    cy.wait('@listar')

    cy.get('[data-cy=medicamentos-item][data-id="1"]').within(() => {
      cy.get('[data-cy=medicamentos-nome]').should('contain', 'Ácido fólico')
      cy.contains('1 comprimido 5mg').should('be.visible')
      cy.get('[data-cy=medicamentos-horario]').should('contain', '08:00')
      cy.get('[data-cy=medicamentos-instrucoes]').should(
        'contain',
        'Tomar após o café da manhã',
      )
    })
  })

  it('marca um medicamento pendente como tomado (cenário BDD: marcar)', () => {
    cy.intercept('GET', ROTA_LISTA, { body: medicamentosMock }).as('listar')
    cy.intercept('PATCH', ROTA_TOMA_RE, (req) => {
      expect(req.body).to.deep.equal({ tomado: true })
      req.reply({
        body: { ...medicamentosMock[0], tomado: true },
      })
    }).as('marcar')

    visitarMedicamentos()
    cy.wait('@listar')

    cy.get('[data-cy=medicamentos-item][data-id="1"]')
      .should('have.attr', 'data-tomado', 'false')
      .find('[data-cy=medicamentos-checkbox]')
      .click()

    cy.wait('@marcar')

    cy.get('[data-cy=medicamentos-item][data-id="1"]').should(
      'have.attr',
      'data-tomado',
      'true',
    )
    cy.get('[data-cy=medicamentos-contador]').should('contain', '2')
  })

  it('desmarca um medicamento marcado por engano', () => {
    cy.intercept('GET', ROTA_LISTA, { body: medicamentosMock }).as('listar')
    cy.intercept('PATCH', ROTA_TOMA_RE, (req) => {
      expect(req.body).to.deep.equal({ tomado: false })
      req.reply({
        body: { ...medicamentosMock[1], tomado: false },
      })
    }).as('desmarcar')

    visitarMedicamentos()
    cy.wait('@listar')

    cy.get('[data-cy=medicamentos-item][data-id="2"]')
      .should('have.attr', 'data-tomado', 'true')
      .find('[data-cy=medicamentos-checkbox]')
      .click()

    cy.wait('@desmarcar')

    cy.get('[data-cy=medicamentos-item][data-id="2"]').should(
      'have.attr',
      'data-tomado',
      'false',
    )
    cy.get('[data-cy=medicamentos-contador]').should('contain', '0 de 3')
  })

  it('checkbox tem role e aria-checked corretos', () => {
    cy.intercept('GET', ROTA_LISTA, { body: medicamentosMock }).as('listar')
    visitarMedicamentos()
    cy.wait('@listar')

    cy.get('[data-cy=medicamentos-item][data-id="1"]')
      .find('[data-cy=medicamentos-checkbox]')
      .should('have.attr', 'role', 'checkbox')
      .and('have.attr', 'aria-checked', 'false')

    cy.get('[data-cy=medicamentos-item][data-id="2"]')
      .find('[data-cy=medicamentos-checkbox]')
      .should('have.attr', 'aria-checked', 'true')
  })

  it('atualização otimista: a UI muda antes da resposta do servidor', () => {
    cy.intercept('GET', ROTA_LISTA, { body: medicamentosMock }).as('listar')
    cy.intercept('PATCH', ROTA_TOMA_RE, (req) => {
      // Atrasa a resposta para verificar o otimismo.
      req.reply({
        delay: 800,
        body: { ...medicamentosMock[0], tomado: true },
      })
    }).as('marcarLento')

    visitarMedicamentos()
    cy.wait('@listar')

    cy.get('[data-cy=medicamentos-item][data-id="1"]')
      .find('[data-cy=medicamentos-checkbox]')
      .click()

    // Antes do servidor responder, o item já mostra estado tomado.
    cy.get('[data-cy=medicamentos-item][data-id="1"]').should(
      'have.attr',
      'data-tomado',
      'true',
    )

    cy.wait('@marcarLento')
  })

  it('reverte estado e mostra mensagem quando o PATCH falha', () => {
    cy.intercept('GET', ROTA_LISTA, { body: medicamentosMock }).as('listar')
    cy.intercept('PATCH', ROTA_TOMA_RE, {
      statusCode: 500,
      body: { detail: 'Erro interno' },
    }).as('falha')

    visitarMedicamentos()
    cy.wait('@listar')

    cy.get('[data-cy=medicamentos-item][data-id="1"]')
      .find('[data-cy=medicamentos-checkbox]')
      .click()

    cy.wait('@falha')

    // Estado volta para nao-tomado e mensagem de erro aparece.
    cy.get('[data-cy=medicamentos-item][data-id="1"]').should(
      'have.attr',
      'data-tomado',
      'false',
    )
    cy.get('[data-cy=medicamentos-mensagem-erro-toggle]')
      .should('be.visible')
      .and('have.attr', 'role', 'alert')
      .and('contain', 'Não conseguimos atualizar este medicamento')
  })

  it('exibe mensagem amigável quando não há medicamentos (cenário BDD: nenhum)', () => {
    cy.intercept('GET', ROTA_LISTA, { body: [] }).as('listar')
    visitarMedicamentos()
    cy.wait('@listar')

    cy.get('[data-cy=medicamentos-mensagem-vazia]')
      .should('be.visible')
      .and('contain', 'Você ainda não tem medicamentos cadastrados')
    cy.get('[data-cy=medicamentos-item]').should('not.exist')
  })

  it('exibe mensagem de erro acessível quando a API falha no carregamento', () => {
    cy.intercept('GET', ROTA_LISTA, { statusCode: 500, body: {} }).as('falha')
    visitarMedicamentos()
    cy.wait('@falha')

    cy.get('[data-cy=medicamentos-mensagem-erro]')
      .should('be.visible')
      .and('have.attr', 'role', 'alert')
      .and('contain', 'Não foi possível carregar seus medicamentos')
  })

  it('sidebar tem link Medicamentos que leva à página correta', () => {
    cy.intercept('GET', ROTA_LISTA, { body: medicamentosMock }).as('listar')
    visitarMedicamentos('/')

    cy.get('[data-cy=nav-medicamentos]')
      .should('be.visible')
      .and('have.attr', 'href', '/medicamentos')
      .click()

    cy.location('pathname').should('eq', '/medicamentos')
    cy.contains('h1', 'Medicamentos').should('be.visible')
  })
})
