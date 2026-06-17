// Área da médica: agora dentro do shell unificado (mesma base da paciente, com
// navegação por papel). Cobre controle de acesso, o acompanhamento das
// pacientes (lista em abas por vínculo, detalhe, agendar consulta, cadastrar
// medicamento) e o fluxo de "assumir atendimento" (RBAC do backend na UI).
// As chamadas ao backend são mockadas com cy.intercept.

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

const PERMISSAO_RESPONSAVEL = {
  papel: 'responsavel',
  pode_editar: true,
  rotulo: 'Responsável: você',
}
const PERMISSAO_VISUALIZACAO = {
  papel: 'visualizacao',
  pode_editar: false,
  rotulo: 'Visualização apenas',
}
const PERMISSAO_ASSUMIDO = {
  papel: 'assumido',
  pode_editar: true,
  rotulo: 'Atendimento assumido',
}

const PACIENTE_RESUMO = {
  id: 1,
  nome_completo: 'Renata Cegonha',
  telefone: '(81) 99777-3030',
  tipo_sanguineo: 'A+',
  total_consultas: 1,
  total_medicamentos: 1,
  permissao: PERMISSAO_RESPONSAVEL,
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
  permissao: PERMISSAO_RESPONSAVEL,
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

// Paciente de outra médica: a Dra. Helena só visualiza (não pode editar).
const PACIENTE_VIS_RESUMO = {
  id: 2,
  nome_completo: 'Aurora Lima',
  telefone: '',
  tipo_sanguineo: '',
  total_consultas: 0,
  total_medicamentos: 0,
  permissao: PERMISSAO_VISUALIZACAO,
}

function detalheAurora(permissao) {
  return {
    id: 2,
    nome_completo: 'Aurora Lima',
    telefone: '',
    email: 'aurora@amare.test',
    data_nascimento: null,
    tipo_sanguineo: '',
    medicamentos_em_uso: '',
    observacoes_medicas: '',
    permissao,
    consultas: [],
    medicamentos: [],
  }
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
    // Mocks defensivos da área da paciente / shell.
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
    cy.contains('h1', 'Pacientes').should('be.visible')
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

  it('médica usa o shell unificado (sidebar por papel, header e rodapé)', () => {
    visitarComo(SESSAO_MEDICA, '/area-medica')
    cy.get('[data-cy=app-layout]').should('be.visible')
    cy.get('[data-cy=app-header]').should('be.visible')
    cy.get('[data-cy=rodape]').should('exist')
    cy.get('[data-cy=nav-pacientes]').should('have.attr', 'href', '/area-medica')
    // A médica também vê o conteúdo institucional da clínica...
    cy.get('[data-cy=nav-dicionario]').should('have.attr', 'href', '/dicionario')
    // ...mas não a navegação de dados pessoais da paciente.
    cy.get('[data-cy=nav-home]').should('not.exist')
    cy.get('[data-cy=nav-sintomas]').should('not.exist')
    cy.get('[data-cy=nav-ciclo]').should('not.exist')
  })

  it('médica acessa o conteúdo da clínica e a busca pelo shell', () => {
    cy.intercept('GET', '**/api/dicionario/termos/**', { body: [] })
    cy.intercept('GET', '**/api/busca/**', { body: [] })

    visitarComo(SESSAO_MEDICA, '/area-medica')
    cy.wait('@listaPacientes')

    // Conteúdo da clínica pela sidebar (não é expulsa para /area-medica).
    cy.get('[data-cy=nav-dicionario]').click()
    cy.location('pathname').should('eq', '/dicionario')
    cy.contains('h1', 'Dicionário').should('be.visible')

    // A busca do header funciona para a médica.
    cy.get('[data-cy=app-search-input]').type('fiv')
    cy.get('[data-cy=app-search-enviar]').click()
    cy.location('pathname').should('eq', '/busca')
    cy.get('[data-cy=page-area-medica]').should('not.exist')
  })

  it('médica sai da conta pela sidebar do shell', () => {
    visitarComo(SESSAO_MEDICA, '/area-medica')
    cy.get('[data-cy=nav-logout]').click()
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
    cy.get('[data-cy=detalhe-permissao]').should('contain', 'Responsável: você')
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

  // --- abas por vínculo + RBAC (assumir atendimento) ---

  it('médica filtra as pacientes pelas abas (Minhas / Compartilhadas / Todas)', () => {
    cy.intercept('GET', '**/api/medica/pacientes/', {
      body: [
        PACIENTE_RESUMO,
        PACIENTE_VIS_RESUMO,
        {
          id: 3,
          nome_completo: 'Beatriz Sol',
          telefone: '',
          tipo_sanguineo: '',
          total_consultas: 2,
          total_medicamentos: 1,
          permissao: PERMISSAO_ASSUMIDO,
        },
      ],
    }).as('listaPacientes')

    visitarComo(SESSAO_MEDICA, '/area-medica')
    cy.wait('@listaPacientes')

    // Aba inicial: Minhas (só a responsável).
    cy.get('[data-cy=aba-minhas]').should('have.attr', 'aria-selected', 'true')
    cy.get('[data-cy=paciente-1]').should('be.visible')
    cy.get('[data-cy=paciente-2]').should('not.exist')
    cy.get('[data-cy=paciente-3]').should('not.exist')

    // Compartilhadas: só a assumida.
    cy.get('[data-cy=aba-compartilhadas]').click()
    cy.get('[data-cy=paciente-3]').should('be.visible')
    cy.get('[data-cy=paciente-1]').should('not.exist')

    // Todas: as três, com selo de acesso na lista.
    cy.get('[data-cy=aba-todas]').click()
    cy.get('[data-cy=paciente-1]').should('be.visible')
    cy.get('[data-cy=paciente-2]').should('be.visible')
    cy.get('[data-cy=paciente-3]').should('be.visible')
    cy.get('[data-cy=paciente-2-selo]').should('contain', 'Só leitura')
  })

  it('médica em visualização não vê os formulários de escrita', () => {
    cy.intercept('GET', '**/api/medica/pacientes/', {
      body: [PACIENTE_VIS_RESUMO],
    }).as('listaPacientes')
    cy.intercept('GET', '**/api/medica/pacientes/2/', {
      body: detalheAurora(PERMISSAO_VISUALIZACAO),
    }).as('detalheVis')

    visitarComo(SESSAO_MEDICA, '/area-medica')
    cy.wait('@listaPacientes')
    cy.get('[data-cy=aba-todas]').click()
    cy.get('[data-cy=paciente-2]').click()
    cy.wait('@detalheVis')

    cy.get('[data-cy=detalhe-permissao]').should('contain', 'Visualização apenas')
    cy.get('[data-cy=detalhe-somente-leitura]').should('be.visible')
    cy.get('[data-cy=consulta-enviar]').should('not.exist')
    cy.get('[data-cy=medicamento-enviar]').should('not.exist')
  })

  it('médica assume o atendimento e passa a poder editar', () => {
    cy.intercept('GET', '**/api/medica/pacientes/', {
      body: [PACIENTE_VIS_RESUMO],
    }).as('listaPacientes')

    // O detalhe responde conforme o estado: visualização antes de assumir,
    // editável depois. Usa uma flag (não a contagem de chamadas) para não
    // depender da dupla montagem do StrictMode.
    let assumiu = false
    cy.intercept('GET', '**/api/medica/pacientes/2/', (req) => {
      req.reply({
        body: detalheAurora(assumiu ? PERMISSAO_ASSUMIDO : PERMISSAO_VISUALIZACAO),
      })
    }).as('detalheVis')

    cy.intercept('POST', '**/api/medica/pacientes/2/assumir/', (req) => {
      assumiu = true
      req.reply({
        statusCode: 201,
        body: {
          detail: 'Atendimento assumido. Você já pode registrar alterações.',
          permissao: PERMISSAO_ASSUMIDO,
          vinculo: { id: 9, papel: 'substituta', ja_estava_ativo: false },
        },
      })
    }).as('assumir')

    visitarComo(SESSAO_MEDICA, '/area-medica')
    cy.wait('@listaPacientes')
    cy.get('[data-cy=aba-todas]').click()
    cy.get('[data-cy=paciente-2]').click()

    cy.get('[data-cy=assumir-abrir]').click()
    cy.get('[data-cy=assumir-dialog]').should('be.visible')
    cy.get('[data-cy=assumir-motivo]').select('plantao')
    cy.get('[data-cy=assumir-confirmar]').click()
    cy.wait('@assumir')

    // Após assumir, o detalhe recarrega editável → formulários aparecem.
    cy.get('[data-cy=detalhe-permissao]').should('contain', 'Atendimento assumido')
    cy.get('[data-cy=detalhe-feedback]').should('contain', 'assumido')
    cy.get('[data-cy=consulta-enviar]').should('be.visible')
  })

  it('assumir com motivo "Outro" exige a observação', () => {
    cy.intercept('GET', '**/api/medica/pacientes/', {
      body: [PACIENTE_VIS_RESUMO],
    }).as('listaPacientes')
    cy.intercept('GET', '**/api/medica/pacientes/2/', {
      body: detalheAurora(PERMISSAO_VISUALIZACAO),
    }).as('detalheVis')
    cy.intercept('POST', '**/api/medica/pacientes/2/assumir/', {
      statusCode: 201,
      body: {},
    }).as('postAssumir')

    visitarComo(SESSAO_MEDICA, '/area-medica')
    cy.wait('@listaPacientes')
    cy.get('[data-cy=aba-todas]').click()
    cy.get('[data-cy=paciente-2]').click()
    cy.wait('@detalheVis')

    cy.get('[data-cy=assumir-abrir]').click()
    cy.get('[data-cy=assumir-motivo]').select('outro')
    cy.get('[data-cy=assumir-confirmar]').click()

    cy.get('[data-cy=assumir-erro]').should('be.visible')
    cy.get('[data-cy=assumir-dialog]').should('be.visible')
    // A validação do frontend impede a chamada ao backend.
    cy.get('@postAssumir.all').should('have.length', 0)
  })

  // --- cadastro de nova paciente (convite de primeiro acesso) ---

  const RESPOSTA_CADASTRO = {
    statusCode: 201,
    body: {
      paciente: {
        id: 50,
        nome_completo: 'Aurora Lima',
        email: 'aurora@amare.test',
        username: 'aurora-lima',
      },
      convite: {
        token: 'tok-123',
        link: 'http://localhost/ativar/tok-123',
        expira_em: '2026-07-01T00:00:00Z',
        status: 'pendente',
      },
    },
  }

  it('médica cadastra nova paciente e recebe o link de primeiro acesso', () => {
    cy.intercept('POST', '**/api/clinica/pacientes/', RESPOSTA_CADASTRO).as(
      'criarPaciente',
    )

    visitarComo(SESSAO_MEDICA, '/area-medica')
    cy.wait('@listaPacientes')

    cy.get('[data-cy=nova-paciente-abrir]').click()
    cy.get('[data-cy=nova-paciente-nome]').type('Aurora Lima')
    cy.get('[data-cy=nova-paciente-email]').type('aurora@amare.test')
    cy.get('[data-cy=nova-paciente-enviar]').click()

    cy.wait('@criarPaciente')
    cy.get('[data-cy=nova-paciente-sucesso]').should('be.visible')
    cy.get('[data-cy=nova-paciente-link]').should(
      'have.value',
      'http://localhost/ativar/tok-123',
    )
  })

  it('médica gera um novo link para a paciente recém-cadastrada', () => {
    cy.intercept('POST', '**/api/clinica/pacientes/', RESPOSTA_CADASTRO).as(
      'criarPaciente',
    )
    cy.intercept('POST', '**/api/clinica/pacientes/50/reenviar-convite/', {
      statusCode: 201,
      body: {
        convite: {
          token: 'tok-999',
          link: 'http://localhost/ativar/tok-999',
          expira_em: '2026-07-02T00:00:00Z',
          status: 'pendente',
        },
      },
    }).as('reenviar')

    visitarComo(SESSAO_MEDICA, '/area-medica')
    cy.wait('@listaPacientes')

    cy.get('[data-cy=nova-paciente-abrir]').click()
    cy.get('[data-cy=nova-paciente-nome]').type('Aurora Lima')
    cy.get('[data-cy=nova-paciente-email]').type('aurora@amare.test')
    cy.get('[data-cy=nova-paciente-enviar]').click()
    cy.wait('@criarPaciente')

    cy.get('[data-cy=nova-paciente-reenviar]').click()
    cy.wait('@reenviar')
    cy.get('[data-cy=nova-paciente-link]').should(
      'have.value',
      'http://localhost/ativar/tok-999',
    )
  })
})
