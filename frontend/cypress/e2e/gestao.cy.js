// Painel da administração (/gestao): controle de acesso por papel, visão geral,
// CRUD do dicionário e leitura dos logs de auditoria. As chamadas são mockadas.
// O painel vive em /gestao (a rota /admin pertence ao Django admin).

const SESSAO_ADMIN = {
  access: 'token-de-acesso-fake',
  refresh: 'token-de-refresh-fake',
  usuario: {
    id: 9,
    username: 'admin_teste',
    email: 'admin@amare.test',
    tipo_usuario: 'admin',
    nome_completo: 'Marina Gestora',
  },
}

const SESSAO_PACIENTE = {
  access: 'token-de-acesso-fake',
  refresh: 'token-de-refresh-fake',
  usuario: {
    id: 1,
    username: 'renata',
    email: 'renata@amare.test',
    tipo_usuario: 'paciente',
    nome_completo: 'Renata Cegonha',
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

const VISAO_GERAL = {
  pacientes: 12,
  medicas: 3,
  convites_pendentes: 2,
  termos: 40,
  termos_inativos: 1,
  logs: 57,
}

const TERMO = {
  id: 1,
  termo: 'Folículo',
  definicao: 'Estrutura do ovário que abriga o óvulo.',
  categoria: 'Anatomia',
  exemplo: '',
  artigos_relacionados: [],
  ativo: true,
}

function visitarComo(sessao, rota) {
  return cy.visit(rota, {
    onBeforeLoad(janela) {
      janela.localStorage.setItem('marea_auth', JSON.stringify(sessao))
    },
  })
}

describe('Painel da administração e controle de acesso', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    cy.intercept('GET', '**/api/admin/visao-geral/', { body: VISAO_GERAL }).as(
      'visaoGeral',
    )
    cy.intercept('GET', '**/api/admin/logs/', { body: [] }).as('logs')
    cy.intercept('GET', '**/api/admin/termos/', { body: [TERMO] }).as('termos')
    // Mocks defensivos das outras áreas (quando um papel é redirecionado).
    cy.intercept('GET', '**/api/medica/pacientes/', { body: [] })
    cy.intercept('GET', '**/api/consultas/proximas/', { body: [] })
    cy.intercept('GET', '**/api/consultas/', { body: [] })
    cy.intercept('GET', '**/api/medicamentos/', { body: [] })
    cy.intercept('GET', '**/api/perfil/', { body: {} })
  })

  // --- controle de acesso ---

  it('admin é levada para /gestao ao acessar a raiz', () => {
    visitarComo(SESSAO_ADMIN, '/')
    cy.location('pathname').should('eq', '/gestao')
    cy.get('[data-cy=page-gestao]').should('be.visible')
    cy.contains('h1', 'Painel da administração').should('be.visible')
  })

  it('paciente não acessa o painel da administração', () => {
    visitarComo(SESSAO_PACIENTE, '/gestao')
    cy.location('pathname').should('eq', '/')
    cy.get('[data-cy=page-gestao]').should('not.exist')
  })

  it('médica não acessa o painel da administração', () => {
    visitarComo(SESSAO_MEDICA, '/gestao')
    cy.location('pathname').should('eq', '/area-medica')
    cy.get('[data-cy=page-gestao]').should('not.exist')
  })

  it('admin usa o shell com a navegação da administração', () => {
    visitarComo(SESSAO_ADMIN, '/gestao')
    cy.get('[data-cy=app-layout]').should('be.visible')
    cy.get('[data-cy=nav-gestao]').should('have.attr', 'href', '/gestao')
    cy.get('[data-cy=nav-gestao-dicionario]').should(
      'have.attr',
      'href',
      '/gestao/dicionario',
    )
    cy.get('[data-cy=nav-gestao-logs]').should('have.attr', 'href', '/gestao/logs')
    // Não vê a navegação de paciente nem de médica.
    cy.get('[data-cy=nav-home]').should('not.exist')
    cy.get('[data-cy=nav-pacientes]').should('not.exist')
  })

  // --- visão geral ---

  it('mostra as contagens na visão geral', () => {
    visitarComo(SESSAO_ADMIN, '/gestao')
    cy.wait('@visaoGeral')
    cy.get('[data-cy=gestao-card-pacientes]').should('contain', '12')
    cy.get('[data-cy=gestao-card-termos]').should('contain', '40')
    cy.get('[data-cy=gestao-card-convites_pendentes]').should('contain', '2')
  })

  // --- CRUD do dicionário ---

  it('lista os termos do dicionário', () => {
    visitarComo(SESSAO_ADMIN, '/gestao/dicionario')
    cy.wait('@termos')
    cy.get('[data-cy=termo-lista]').should('contain', 'Folículo')
    cy.get('[data-cy=termo-item-1]').should('be.visible')
  })

  it('cria um novo termo', () => {
    cy.intercept('POST', '**/api/admin/termos/', {
      statusCode: 201,
      body: { id: 2, termo: 'Blastocisto', definicao: 'Embrião inicial.', ativo: true },
    }).as('criar')

    visitarComo(SESSAO_ADMIN, '/gestao/dicionario')
    cy.wait('@termos')
    cy.get('[data-cy=termo-termo]').type('Blastocisto')
    cy.get('[data-cy=termo-definicao]').type('Embrião em estágio inicial.')
    cy.get('[data-cy=termo-salvar]').click()
    cy.wait('@criar')
    cy.get('[data-cy=gestao-feedback]').should('contain', 'criado')
  })

  it('edita um termo existente', () => {
    cy.intercept('PATCH', '**/api/admin/termos/1/', {
      statusCode: 200,
      body: { ...TERMO, definicao: 'Nova definição.' },
    }).as('editar')

    visitarComo(SESSAO_ADMIN, '/gestao/dicionario')
    cy.wait('@termos')
    cy.get('[data-cy=termo-editar-1]').click()
    cy.get('[data-cy=termo-definicao]').clear().type('Nova definição.')
    cy.get('[data-cy=termo-salvar]').click()
    cy.wait('@editar')
    cy.get('[data-cy=gestao-feedback]').should('contain', 'atualizado')
  })

  it('exclui um termo com confirmação', () => {
    cy.intercept('DELETE', '**/api/admin/termos/1/', { statusCode: 204 }).as(
      'excluir',
    )

    visitarComo(SESSAO_ADMIN, '/gestao/dicionario')
    cy.wait('@termos')
    cy.get('[data-cy=termo-excluir-1]').click()
    cy.get('[data-cy=termo-confirm-excluir]').should('be.visible')
    cy.get('[data-cy=termo-confirm-excluir-sim]').click()
    cy.wait('@excluir')
    cy.get('[data-cy=gestao-feedback]').should('contain', 'excluído')
  })

  it('mostra a mensagem do backend ao criar termo duplicado', () => {
    cy.intercept('POST', '**/api/admin/termos/', {
      statusCode: 400,
      body: { termo: ['termo dicionário com este Termo já existe.'] },
    }).as('criarDup')

    visitarComo(SESSAO_ADMIN, '/gestao/dicionario')
    cy.wait('@termos')
    cy.get('[data-cy=termo-termo]').type('Folículo')
    cy.get('[data-cy=termo-definicao]').type('Outra definição.')
    cy.get('[data-cy=termo-salvar]').click()
    cy.wait('@criarDup')
    cy.get('[data-cy=gestao-feedback]').should('contain', 'já existe')
  })

  // --- logs de auditoria ---

  it('lista os eventos de auditoria', () => {
    cy.intercept('GET', '**/api/admin/logs/', {
      body: [
        {
          id: 1,
          usuario_nome: 'medica_teste',
          acao: 'assumir_atendimento',
          acao_display: 'Assumiu o atendimento',
          entidade: 'equipe_cuidado',
          entidade_display: 'Equipe de cuidado',
          entidade_id: 5,
          paciente_nome: 'Renata Cegonha',
          motivo: 'Plantão',
          data_hora: '2026-06-17T10:00:00Z',
        },
      ],
    }).as('logsCheios')

    visitarComo(SESSAO_ADMIN, '/gestao/logs')
    cy.wait('@logsCheios')
    cy.get('[data-cy=logs-lista]').should('contain', 'Assumiu o atendimento')
    cy.get('[data-cy=logs-lista]').should('contain', 'Renata Cegonha')
  })

  it('mostra estado vazio quando não há logs', () => {
    visitarComo(SESSAO_ADMIN, '/gestao/logs')
    cy.wait('@logs')
    cy.get('[data-cy=logs-vazio]').should('be.visible')
  })
})
