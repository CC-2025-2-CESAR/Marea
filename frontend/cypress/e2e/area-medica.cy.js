// Área da médica: controle de acesso por papel + fluxo de acompanhamento das
// pacientes vinculadas (lista, detalhe, agendar consulta, cadastrar
// medicamento). As chamadas ao backend são mockadas com cy.intercept.

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
    username: 'renata',
    email: 'renata@amare.test',
    tipo_usuario: 'paciente',
    nome_completo: 'Renata Cegonha',
  },
}

const PACIENTE_RESUMO = {
  id: 1,
  nome_completo: 'Renata Cegonha',
  telefone: '(81) 99777-3030',
  tipo_sanguineo: 'A+',
  total_consultas: 1,
  total_medicamentos: 1,
}

const PACIENTE_DETALHE = {
  id: 1,
  nome_completo: 'Renata Cegonha',
  telefone: '(81) 99777-3030',
  email: 'renata@amare.test',
  data_nascimento: '1994-02-20',
  tipo_sanguineo: 'A+',
  medicamentos_em_uso: '',
  observacoes_medicas: '',
  consultas: [
    {
      id: 10,
      data_horario: '2026-07-01T10:00:00Z',
      local: 'Clínica Amare',
      observacoes: '',
      status: 'agendada',
      status_label: 'Agendada',
      especialidade: null,
      especialidade_nome: '',
      medica: 1,
      medica_nome: 'Dra. Helena Costa',
    },
  ],
  medicamentos: [
    {
      id: 20,
      nome: 'Ácido fólico',
      dose: '5mg',
      horario: '08:00:00',
      instrucoes: '',
      tomado: false,
    },
  ],
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
    // Mocks da área da médica.
    cy.intercept('GET', '**/api/medica/pacientes/', {
      body: [PACIENTE_RESUMO],
    }).as('listaPacientes')
    cy.intercept('GET', '**/api/medica/pacientes/1/', {
      body: PACIENTE_DETALHE,
    }).as('detalhePaciente')
    cy.intercept('POST', '**/api/medica/pacientes/1/consultas/', {
      statusCode: 201,
      body: { id: 11, status: 'agendada' },
    }).as('criarConsulta')
    cy.intercept('POST', '**/api/medica/pacientes/1/medicamentos/', {
      statusCode: 201,
      body: { id: 21, nome: 'Progesterona' },
    }).as('criarMedicamento')
    // Mocks defensivos da área da paciente.
    cy.intercept('GET', '**/api/consultas/proximas/', { body: [] })
    cy.intercept('GET', '**/api/consultas/', { body: [] })
    cy.intercept('GET', '**/api/medicamentos/', { body: [] })
    cy.intercept('GET', '**/api/perfil/', { body: {} })
  })

  // --- controle de acesso ---

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

  // --- fluxo de acompanhamento ---

  it('médica vê suas pacientes vinculadas na lista', () => {
    visitarComo(SESSAO_MEDICA, '/area-medica')
    cy.wait('@listaPacientes')
    cy.get('[data-cy=lista-pacientes]').should('contain', 'Renata Cegonha')
    cy.get('[data-cy=paciente-1]').should('be.visible')
  })

  it('médica abre o detalhe de uma paciente', () => {
    visitarComo(SESSAO_MEDICA, '/area-medica')
    cy.wait('@listaPacientes')
    cy.get('[data-cy=paciente-1]').click()
    cy.wait('@detalhePaciente')
    cy.get('[data-cy=detalhe-paciente]').should('be.visible')
    cy.get('[data-cy=lista-consultas]').should('contain', 'Agendada')
    cy.get('[data-cy=lista-medicamentos]').should('contain', 'Ácido fólico')
  })

  it('médica agenda uma consulta para a paciente', () => {
    visitarComo(SESSAO_MEDICA, '/area-medica')
    cy.wait('@listaPacientes')
    cy.get('[data-cy=paciente-1]').click()
    cy.wait('@detalhePaciente')
    cy.get('[data-cy=consulta-data]').type('2026-08-15T14:30')
    cy.get('[data-cy=consulta-local]').type('Clínica Amare')
    cy.get('[data-cy=consulta-enviar]').click()
    cy.wait('@criarConsulta')
    cy.get('[data-cy=detalhe-feedback]').should('contain', 'agendada')
  })

  it('médica cadastra um medicamento para a paciente', () => {
    visitarComo(SESSAO_MEDICA, '/area-medica')
    cy.wait('@listaPacientes')
    cy.get('[data-cy=paciente-1]').click()
    cy.wait('@detalhePaciente')
    cy.get('[data-cy=medicamento-nome]').type('Progesterona')
    cy.get('[data-cy=medicamento-enviar]').click()
    cy.wait('@criarMedicamento')
    cy.get('[data-cy=detalhe-feedback]').should('contain', 'cadastrado')
  })
})
