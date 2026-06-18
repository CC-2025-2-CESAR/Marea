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

const SINTOMAS_MOCK = [
  {
    id: 10,
    data: '2026-05-20',
    tipo: 'Náusea',
    descricao: 'Leve, pela manhã.',
    intensidade: 2,
  },
]

const CICLO_MOCK = [
  {
    id: 5,
    data: '2026-05-18',
    etapa: 'menstruacao',
    etapa_display: 'Menstruação',
    observacoes: 'Fluxo moderado.',
    status: 'registrado',
  },
]

function visitarComSessao(rota = '/perfil') {
  cy.visit(rota, {
    onBeforeLoad(janela) {
      janela.localStorage.setItem('marea_auth', JSON.stringify(SESSAO_FAKE))
    },
  })
}

describe('Página de Perfil da Amare', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    // Padrões para "Meus registros" — testes específicos sobrescrevem.
    cy.intercept('GET', '**/api/sintomas/', { body: [] }).as('sintomas')
    cy.intercept('GET', '**/api/ciclo/registros/', { body: [] }).as('ciclo')
  })

  it('redireciona para /login quando nao ha sessao salva', () => {
    cy.visit('/perfil')
    cy.location('pathname').should('eq', '/login')
  })

  it('exibe titulo e dados do perfil ao carregar', () => {
    cy.intercept('GET', '**/api/perfil/', { body: PERFIL_MOCK }).as('perfil')
    visitarComSessao()
    cy.wait('@perfil')

    cy.get('[data-cy=page-perfil]').should('be.visible')
    cy.contains('h1', 'Perfil').should('be.visible')
    cy.get('[data-cy=perfil-nome]').should('have.value', 'Júlia Pereira')
    cy.get('[data-cy=perfil-telefone]').should('have.value', '(81) 91234-5678')
    cy.get('[data-cy=perfil-data-nascimento]').should('have.value', '1993-04-12')
  })

  it('nao mostra mais o campo de tipo sanguineo nem botoes "em breve"', () => {
    cy.intercept('GET', '**/api/perfil/', { body: PERFIL_MOCK }).as('perfil')
    visitarComSessao()
    cy.wait('@perfil')

    cy.get('[data-cy=perfil-tipo-sanguineo]').should('not.exist')
    cy.get('[data-cy=perfil-botoes-secundarios]').should('not.exist')
    cy.contains('button', 'Editar foto').should('not.exist')
    cy.contains('button', 'Editar plano').should('not.exist')
  })

  it('mostra o e-mail como leitura apenas', () => {
    cy.intercept('GET', '**/api/perfil/', { body: PERFIL_MOCK }).as('perfil')
    visitarComSessao()
    cy.wait('@perfil')

    cy.get('[data-cy=perfil-email]')
      .should('have.value', 'paciente@amare.test')
      .and('have.attr', 'readonly')
  })

  it('exibe medicamentos e observacoes como texto', () => {
    cy.intercept('GET', '**/api/perfil/', { body: PERFIL_MOCK }).as('perfil')
    visitarComSessao()
    cy.wait('@perfil')

    cy.get('[data-cy=perfil-medicamentos]').should(
      'contain',
      'Ácido fólico 5mg, uma vez ao dia.',
    )
    cy.get('[data-cy=perfil-observacoes]').should(
      'contain',
      'Em acompanhamento para indução da ovulação.',
    )
  })

  it('mostra "Meus registros" com sintomas e troca para a aba de ciclo', () => {
    cy.intercept('GET', '**/api/perfil/', { body: PERFIL_MOCK }).as('perfil')
    cy.intercept('GET', '**/api/sintomas/', { body: SINTOMAS_MOCK }).as(
      'sintomas',
    )
    cy.intercept('GET', '**/api/ciclo/registros/', { body: CICLO_MOCK }).as(
      'ciclo',
    )
    visitarComSessao()
    cy.wait('@perfil')
    cy.wait('@sintomas')

    cy.get('[data-cy=perfil-registros]').should('be.visible')
    cy.get('[data-cy=perfil-registro-item]').should('contain', 'Náusea')

    cy.get('[data-cy=perfil-registros-aba-ciclo]').click()
    cy.get('[data-cy=perfil-registro-item]').should('contain', 'Menstruação')
  })

  it('mostra estado vazio em "Meus registros" quando nao ha sintomas', () => {
    cy.intercept('GET', '**/api/perfil/', { body: PERFIL_MOCK }).as('perfil')
    visitarComSessao()
    cy.wait('@perfil')
    cy.wait('@sintomas')

    cy.get('[data-cy=perfil-registros] [data-cy=empty-state]').should(
      'be.visible',
    )
    cy.get('[data-cy=perfil-registros-ir-sintomas]').should(
      'have.attr',
      'href',
      '/sintomas',
    )
  })

  it('tem o bloco de privacidade com atalhos para Meus dados e a politica', () => {
    cy.intercept('GET', '**/api/perfil/', { body: PERFIL_MOCK }).as('perfil')
    visitarComSessao()
    cy.wait('@perfil')

    cy.get('[data-cy=perfil-privacidade]').should('be.visible')
    cy.get('[data-cy=perfil-link-meus-dados]').should(
      'have.attr',
      'href',
      '/meus-dados',
    )
    cy.get('[data-cy=perfil-link-privacidade]').should(
      'have.attr',
      'href',
      '/privacidade',
    )
  })

  it('salva alteracoes do perfil e mostra mensagem de sucesso', () => {
    cy.intercept('GET', '**/api/perfil/', { body: PERFIL_MOCK }).as('perfil')
    cy.intercept('PATCH', '**/api/perfil/', (req) => {
      req.reply({
        statusCode: 200,
        body: { ...PERFIL_MOCK, telefone: '(81) 99999-1234' },
      })
    }).as('salvar')

    visitarComSessao()
    cy.wait('@perfil')

    cy.get('[data-cy=perfil-telefone]').clear().type('(81) 99999-1234')
    cy.get('[data-cy=perfil-salvar]').click()

    cy.wait('@salvar')
    cy.get('[data-cy=toast]')
      .should('be.visible')
      .and('contain', 'Perfil atualizado com sucesso.')
  })

  it('exibe mensagem de erro quando a API falha ao salvar', () => {
    cy.intercept('GET', '**/api/perfil/', { body: PERFIL_MOCK }).as('perfil')
    cy.intercept('PATCH', '**/api/perfil/', { statusCode: 500, body: {} }).as(
      'salvar',
    )

    visitarComSessao()
    cy.wait('@perfil')

    cy.get('[data-cy=perfil-telefone]').clear().type('(81) 90000-0000')
    cy.get('[data-cy=perfil-salvar]').click()

    cy.wait('@salvar')
    cy.get('[data-cy=perfil-feedback]')
      .should('be.visible')
      .and('contain', 'Não foi possível salvar agora.')
  })

  it('mostra mensagem de erro quando o carregamento inicial falha', () => {
    cy.intercept('GET', '**/api/perfil/', { statusCode: 500, body: {} }).as(
      'perfil',
    )
    visitarComSessao()
    cy.wait('@perfil')

    cy.get('[data-cy=perfil-mensagem-erro]')
      .should('be.visible')
      .and('contain', 'Não foi possível carregar seu perfil no momento.')
  })

  it('o botao Sair limpa a sessao e volta para /login', () => {
    cy.intercept('GET', '**/api/perfil/', { body: PERFIL_MOCK }).as('perfil')
    visitarComSessao()
    cy.wait('@perfil')

    cy.get('[data-cy=nav-logout]').click()
    cy.location('pathname').should('eq', '/login')
    cy.window().its('localStorage.marea_auth').should('be.undefined')
  })
})
