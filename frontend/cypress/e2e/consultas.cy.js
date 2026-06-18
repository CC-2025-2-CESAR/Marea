// Suite de testes da página /calendario (Consultas) e do banner de próxima
// consulta na Home. Cobre os cenários BDD da história PROJ-1.

const ROTA_LISTA = '**/api/consultas/'
const ROTA_PROXIMAS = '**/api/consultas/proximas/'

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

// Mock de 4 consultas em maio/2026 cobrindo todos os status.
const consultasMock = [
  {
    id: 1,
    data_horario: '2026-05-27T17:30:00Z',
    local: 'Clínica Amare - Sala 3',
    observacoes: 'Trazer exames de sangue da última semana.',
    status: 'agendada',
    status_label: 'Agendada',
    especialidade: 1,
    especialidade_nome: 'Reprodução humana',
    medica: 1,
    medica_nome: 'Dra. Helena Costa',
  },
  {
    id: 2,
    data_horario: '2026-05-30T12:00:00Z',
    local: 'Clínica Amare - Sala 1',
    observacoes: 'Jejum de 8 horas antes do exame.',
    status: 'agendada',
    status_label: 'Agendada',
    especialidade: 2,
    especialidade_nome: 'Endocrinologia',
    medica: null,
    medica_nome: '',
  },
  {
    id: 3,
    data_horario: '2026-05-15T19:00:00Z',
    local: 'Clínica Amare - Sala 3',
    observacoes: 'Resultado do beta-hCG conversado.',
    status: 'realizada',
    status_label: 'Realizada',
    especialidade: 1,
    especialidade_nome: 'Reprodução humana',
    medica: 1,
    medica_nome: 'Dra. Helena Costa',
  },
  {
    id: 4,
    data_horario: '2026-05-22T13:00:00Z',
    local: 'Online (videochamada)',
    observacoes: 'Cancelada pela clínica - será reagendada.',
    status: 'cancelada',
    status_label: 'Cancelada',
    especialidade: 3,
    especialidade_nome: 'Psicologia',
    medica: null,
    medica_nome: '',
  },
]

const proximasMock = [consultasMock[0], consultasMock[1]]

// Eventos do tratamento (PROJ-15): um futuro (28/05) e um passado (15/05).
const eventosMock = [
  {
    id: 1,
    titulo: 'Ultrassom folicular',
    descricao: 'Avaliação do crescimento dos folículos.',
    data_horario: '2026-05-28T12:00:00Z',
    tipo: 'procedimento',
    tipo_label: 'Procedimento',
  },
  {
    id: 2,
    titulo: 'Exame de sangue',
    descricao: 'Coleta em jejum.',
    data_horario: '2026-05-15T11:00:00Z',
    tipo: 'exame',
    tipo_label: 'Exame',
  },
]

// Rotina de medicamentos (PROJ-19): diária, com status do dia. No drawer ela
// só aparece no dia de hoje (25/05, fixado abaixo).
const medicamentosMock = [
  {
    id: 7,
    nome: 'Progesterona',
    dose: '200mg',
    horario: '20:00:00',
    instrucoes: 'Via vaginal à noite.',
    tomado: false,
    status_dia: 'pendente',
    status_dia_label: 'Pendente',
  },
]

// Fixa a data atual em 25 de maio de 2026 (meio-dia UTC). Garante que os
// testes funcionem independentemente do dia em que rodam, já que os mocks
// usam datas absolutas em maio/2026.
function fixarDataAtual() {
  const inicio = new Date('2026-05-25T12:00:00Z').getTime()
  cy.clock(inicio, ['Date'])
}

function visitarConsultas(rota = '/calendario') {
  return cy.visit(rota, {
    onBeforeLoad(janela) {
      janela.localStorage.setItem('marea_auth', JSON.stringify(SESSAO_FAKE))
    },
  })
}

describe('Calendário de consultas da Amare', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    fixarDataAtual()
    // O painel Lembretes agora carrega medicamentos via API.
    cy.intercept('GET', '**/api/medicamentos/', { body: [] })
    // A página /calendario carrega consultas E eventos (Promise.all).
    cy.intercept('GET', '**/api/eventos/', { body: [] })
    // O calendário também busca o ciclo para marcar menstruação/fértil/etc.
    // Por padrão, sem dados de ciclo (não aparecem marcações nem legenda).
    cy.intercept('GET', '**/api/ciclo/registros/', { body: [] })
    cy.intercept('GET', '**/api/ciclo/previsoes/', { body: { tem_dados: false } })
  })

  it('exibe o título e o cabeçalho da página', () => {
    cy.intercept('GET', ROTA_LISTA, { body: consultasMock }).as('listar')
    visitarConsultas()
    cy.wait('@listar')
    cy.get('[data-cy=page-calendario]').should('be.visible')
    cy.contains('h1', 'Calendário').should('be.visible')
  })

  it('mostra o calendário do mês e o painel lateral quando há consultas', () => {
    cy.intercept('GET', ROTA_LISTA, { body: consultasMock }).as('listar')
    visitarConsultas()
    cy.wait('@listar')

    cy.get('[data-cy=consultas-layout]').should('be.visible')
    cy.get('[data-cy=calendario-mes]').should('be.visible')
    cy.get('[data-cy=painel-proximas]').should('be.visible')
    cy.get('[data-cy=painel-lembretes]').should('be.visible')
  })

  it('abre o calendário no mês da próxima consulta agendada', () => {
    cy.intercept('GET', ROTA_LISTA, { body: consultasMock }).as('listar')
    visitarConsultas()
    cy.wait('@listar')

    cy.get('[data-cy=calendario-mes-titulo]')
      .should('be.visible')
      .and('contain', 'maio de 2026')
  })

  it('marca os dias com consulta agendada na grade do calendário (cenário BDD: visualizar)', () => {
    cy.intercept('GET', ROTA_LISTA, { body: consultasMock }).as('listar')
    visitarConsultas()
    cy.wait('@listar')

    cy.get('[data-cy=calendario-mes-dia][data-dia="27"]')
      .should('have.attr', 'data-com-consulta', 'true')
      .find('[data-cy=calendario-mes-marcador]')
      .should('contain', 'Reprodução humana')

    cy.get('[data-cy=calendario-mes-dia][data-dia="30"]')
      .should('have.attr', 'data-com-consulta', 'true')
      .find('[data-cy=calendario-mes-marcador]')
      .should('contain', 'Endocrinologia')

    // Dias sem consulta não devem ter marcador.
    cy.get('[data-cy=calendario-mes-dia][data-dia="10"]').should(
      'have.attr',
      'data-com-consulta',
      'false',
    )
  })

  it('marca o ciclo no calendario (menstruacao/fertil/previsao) e mostra a legenda', () => {
    cy.intercept('GET', ROTA_LISTA, { body: consultasMock }).as('listar')
    cy.intercept('GET', '**/api/ciclo/registros/', {
      body: [
        {
          id: 1,
          data: '2026-05-03',
          etapa: 'menstruacao',
          etapa_display: 'Menstruação',
          observacoes: '',
          status: 'concluido',
          status_display: 'Concluído',
        },
      ],
    }).as('cicloRegistros')
    cy.intercept('GET', '**/api/ciclo/previsoes/', {
      body: {
        tem_dados: true,
        ciclo_medio_dias: 28,
        proxima_menstruacao: '2026-05-31',
        ovulacao_estimada: '2026-05-18',
        janela_fertil_inicio: '2026-05-14',
        janela_fertil_fim: '2026-05-19',
        etapa_atual: 'folicular',
        etapa_atual_display: 'Fase folicular',
        dia_do_ciclo: 23,
        total_do_ciclo: 28,
        dias_para_proxima: 6,
        atrasada: false,
        chance_gravidez: 'baixa',
      },
    }).as('cicloPrevisoes')
    visitarConsultas()
    cy.wait('@listar')
    cy.wait('@cicloRegistros')
    cy.wait('@cicloPrevisoes')

    // Dia 3: menstruação (registro real).
    cy.get('[data-cy=calendario-mes-dia][data-dia="3"]')
      .find('[data-cy=calendario-mes-ciclo][data-ciclo="menstruacao"]')
      .should('exist')
    // Dia 14: início da janela fértil estimada.
    cy.get('[data-cy=calendario-mes-dia][data-dia="14"]')
      .find('[data-cy=calendario-mes-ciclo][data-ciclo="fertil"]')
      .should('exist')
    // Dia 31: próxima menstruação prevista.
    cy.get('[data-cy=calendario-mes-dia][data-dia="31"]')
      .find('[data-cy=calendario-mes-ciclo][data-ciclo="previsto"]')
      .should('exist')
    // A legenda do ciclo aparece quando há marcações.
    cy.get('[data-cy=calendario-legenda-ciclo]').should('be.visible')
  })

  it('nao mostra a legenda do ciclo quando nao ha marcacoes', () => {
    cy.intercept('GET', ROTA_LISTA, { body: consultasMock }).as('listar')
    visitarConsultas()
    cy.wait('@listar')

    cy.get('[data-cy=calendario-legenda-ciclo]').should('not.exist')
    cy.get('[data-cy=calendario-mes-ciclo]').should('not.exist')
  })

  it('permite navegar para o mês seguinte e voltar para hoje', () => {
    cy.intercept('GET', ROTA_LISTA, { body: consultasMock }).as('listar')
    visitarConsultas()
    cy.wait('@listar')

    cy.get('[data-cy=calendario-mes-proximo]').click()
    cy.get('[data-cy=calendario-mes-titulo]').should('contain', 'junho de 2026')

    cy.get('[data-cy=calendario-mes-hoje]').click()
    cy.get('[data-cy=calendario-mes-titulo]').should('contain', 'maio de 2026')
  })

  it('lista as próximas consultas no painel lateral com data e detalhes', () => {
    cy.intercept('GET', ROTA_LISTA, { body: consultasMock }).as('listar')
    visitarConsultas()
    cy.wait('@listar')

    cy.get('[data-cy=painel-proximas-item]').should('have.length', 2)

    cy.get('[data-cy=painel-proximas-item]')
      .first()
      .within(() => {
        cy.get('[data-cy=painel-proximas-data]')
          .should('be.visible')
          .and('contain', '27 de maio')
        cy.get('[data-cy=painel-proximas-detalhe]')
          .should('contain', 'Reprodução humana')
          .and('contain', 'Dra. Helena Costa')
      })
  })

  it('exibe mensagem amigável quando não há consultas (cenário BDD: nenhuma)', () => {
    cy.intercept('GET', ROTA_LISTA, { body: [] }).as('listar')
    visitarConsultas()
    cy.wait('@listar')
    cy.get('[data-cy=consultas-mensagem-vazia]')
      .should('be.visible')
      .and('contain', 'Você ainda não tem consultas cadastradas')
    cy.get('[data-cy=calendario-mes-marcador]').should('not.exist')
  })

  it('exibe mensagem de erro acessível quando a API falha', () => {
    cy.intercept('GET', ROTA_LISTA, { statusCode: 500, body: {} }).as('falha')
    visitarConsultas()
    cy.wait('@falha')
    cy.get('[data-cy=consultas-mensagem-erro]')
      .should('be.visible')
      .and('have.attr', 'role', 'alert')
      .and('contain', 'Não foi possível carregar sua agenda no momento.')
  })

  it('mostra eventos no calendário e no painel de próximos eventos (PROJ-15)', () => {
    cy.intercept('GET', ROTA_LISTA, { body: consultasMock }).as('listar')
    cy.intercept('GET', '**/api/eventos/', { body: eventosMock }).as('eventos')
    visitarConsultas()
    cy.wait('@listar')
    cy.wait('@eventos')

    // Dia 28 tem evento (e nenhuma consulta agendada) — marcador de evento.
    cy.get('[data-cy=calendario-mes-dia][data-dia="28"]')
      .should('have.attr', 'data-com-evento', 'true')
      .find('[data-cy=calendario-mes-marcador-evento]')
      .should('contain', 'Ultrassom folicular')

    // Painel lista só os eventos a partir de hoje (25/05): o de 28/05.
    cy.get('[data-cy=painel-eventos]').should('be.visible')
    cy.get('[data-cy=painel-eventos-item]').should('have.length', 1)
    cy.get('[data-cy=painel-eventos-item]')
      .first()
      .should('contain', 'Ultrassom folicular')
      .and('contain', 'Procedimento')
  })

  it('mostra mensagem quando não há eventos cadastrados', () => {
    cy.intercept('GET', ROTA_LISTA, { body: consultasMock }).as('listar')
    cy.intercept('GET', '**/api/eventos/', { body: [] }).as('eventos')
    visitarConsultas()
    cy.wait('@listar')
    cy.wait('@eventos')

    cy.get('[data-cy=painel-eventos]').should('be.visible')
    cy.get('[data-cy=eventos-mensagem-vazia]')
      .should('be.visible')
      .and('contain', 'Nenhum evento do tratamento cadastrado')
  })

  it('card de Lembretes renderiza o checklist de medicamentos e link "Ver todos"', () => {
    cy.intercept('GET', ROTA_LISTA, { body: consultasMock }).as('listar')
    cy.intercept('GET', '**/api/medicamentos/', {
      body: [
        {
          id: 1,
          nome: 'Ácido fólico',
          dose: '1 comprimido 5mg',
          horario: '08:00:00',
          instrucoes: 'Tomar após o café.',
          tomado: false,
        },
      ],
    }).as('medicamentos')
    visitarConsultas()
    cy.wait('@listar')
    cy.wait('@medicamentos')

    cy.get('[data-cy=painel-lembretes]')
      .should('be.visible')
      .within(() => {
        cy.contains('h2', 'Lembretes').should('be.visible')
        cy.get('[data-cy=painel-lembretes-link]')
          .should('have.attr', 'href', '/medicamentos')
          .and('contain', 'Ver todos')
        cy.get('[data-cy=medicamentos-checklist]').should(
          'have.attr',
          'data-modo',
          'compacto',
        )
        cy.get('[data-cy=medicamentos-item]').should('have.length', 1)
      })
  })

  it('abre o drawer do dia ao clicar num dia com consulta agendada', () => {
    cy.intercept('GET', ROTA_LISTA, { body: consultasMock }).as('listar')
    visitarConsultas()
    cy.wait('@listar')

    cy.get('[data-cy=calendario-mes-dia][data-dia="27"]')
      .find('[data-cy=calendario-mes-dia-botao]')
      .click()

    cy.get('[data-cy=calendario-dia-drawer]')
      .should('be.visible')
      .within(() => {
        cy.get('[data-cy=calendario-dia-consulta]')
          .should('have.length', 1)
          .and('contain', 'Reprodução humana')
          .and('contain', 'Dra. Helena Costa')
      })
  })

  it('mostra os eventos do tratamento do dia no drawer (PROJ-15)', () => {
    cy.intercept('GET', ROTA_LISTA, { body: consultasMock }).as('listar')
    cy.intercept('GET', '**/api/eventos/', { body: eventosMock }).as('eventos')
    visitarConsultas()
    cy.wait('@listar')
    cy.wait('@eventos')

    cy.get('[data-cy=calendario-mes-dia][data-dia="28"]')
      .find('[data-cy=calendario-mes-dia-botao]')
      .click()

    cy.get('[data-cy=calendario-dia-drawer]')
      .should('be.visible')
      .within(() => {
        cy.get('[data-cy=calendario-dia-evento]')
          .should('have.length', 1)
          .and('contain', 'Ultrassom folicular')
      })
  })

  it('drawer de um dia sem compromissos mostra mensagem vazia e fecha', () => {
    cy.intercept('GET', ROTA_LISTA, { body: consultasMock }).as('listar')
    visitarConsultas()
    cy.wait('@listar')

    cy.get('[data-cy=calendario-mes-dia][data-dia="10"]')
      .find('[data-cy=calendario-mes-dia-botao]')
      .click()

    cy.get('[data-cy=calendario-dia-drawer]').should('be.visible')
    cy.get('[data-cy=calendario-dia-vazio]').should('be.visible')

    cy.get('[data-cy=calendario-dia-drawer-fechar]').click()
    cy.get('[data-cy=calendario-dia-drawer]').should('not.exist')
  })

  it('lista os medicamentos do dia no drawer ao clicar em hoje (PROJ-19)', () => {
    cy.intercept('GET', ROTA_LISTA, { body: consultasMock }).as('listar')
    cy.intercept('GET', '**/api/medicamentos/', {
      body: medicamentosMock,
    }).as('medicamentos')
    visitarConsultas()
    cy.wait('@listar')
    cy.wait('@medicamentos')

    // Hoje é 25/05 (sem consulta nem evento): como é o dia atual, o drawer
    // mostra a rotina de medicamentos com horário, status e link para o detalhe.
    cy.get('[data-cy=calendario-mes-dia][data-dia="25"]')
      .find('[data-cy=calendario-mes-dia-botao]')
      .click()

    cy.get('[data-cy=calendario-dia-drawer]')
      .should('be.visible')
      .within(() => {
        cy.get('[data-cy=calendario-dia-medicamentos]').should('be.visible')
        cy.get('[data-cy=calendario-dia-medicamento]')
          .should('have.length', 1)
          .and('contain', 'Progesterona')
          .and('contain', '20:00')
        cy.get('[data-cy=calendario-dia-medicamento-link]').should(
          'have.attr',
          'href',
          '/medicamentos/7',
        )
        cy.get('[data-cy=calendario-dia-medicamento-status]').should(
          'contain',
          'Pendente',
        )
      })
  })

  it('não mostra a rotina de medicamentos no drawer de um dia que não é hoje', () => {
    cy.intercept('GET', ROTA_LISTA, { body: consultasMock }).as('listar')
    cy.intercept('GET', '**/api/medicamentos/', {
      body: medicamentosMock,
    }).as('medicamentos')
    visitarConsultas()
    cy.wait('@listar')
    cy.wait('@medicamentos')

    // Dia 27 tem consulta, mas não é hoje: a rotina diária não se aplica a ele.
    cy.get('[data-cy=calendario-mes-dia][data-dia="27"]')
      .find('[data-cy=calendario-mes-dia-botao]')
      .click()

    cy.get('[data-cy=calendario-dia-drawer]').should('be.visible')
    cy.get('[data-cy=calendario-dia-consulta]').should('have.length', 1)
    cy.get('[data-cy=calendario-dia-medicamentos]').should('not.exist')
  })

  it('registra menstruação pelo dia direto no drawer (PROJ-5)', () => {
    cy.intercept('GET', ROTA_LISTA, { body: consultasMock }).as('listar')
    cy.intercept('POST', '**/api/ciclo/registros/', {
      statusCode: 201,
      body: {
        id: 50,
        data: '2026-05-10',
        etapa: 'menstruacao',
        etapa_display: 'Menstruação',
        observacoes: '',
        status: 'registrado',
        status_display: 'Registrado',
      },
    }).as('criarCiclo')
    visitarConsultas()
    cy.wait('@listar')

    // Dia 10 não tem consulta/evento: abre o drawer com a seção de registro.
    cy.get('[data-cy=calendario-mes-dia][data-dia="10"]')
      .find('[data-cy=calendario-mes-dia-botao]')
      .click()
    cy.get('[data-cy=calendario-dia-drawer]').should('be.visible')
    cy.get('[data-cy=calendario-dia-registrar]').should('be.visible')

    cy.get('[data-cy=calendario-dia-registrar-ciclo]').click()
    cy.get('[data-cy=calendario-dia-form-ciclo]').should('be.visible')
    // A etapa já vem como "Menstruação"; basta salvar.
    cy.get('[data-cy=calendario-dia-ciclo-salvar]').click()

    cy.wait('@criarCiclo').its('request.body').should((body) => {
      expect(body.data).to.eq('2026-05-10')
      expect(body.etapa).to.eq('menstruacao')
    })
    // O drawer fecha no sucesso e o toast de confirmação aparece.
    cy.get('[data-cy=calendario-dia-drawer]').should('not.exist')
    cy.get('[data-cy=toast]').should('be.visible')
  })

  it('registra sintoma pelo dia direto no drawer (PROJ-21)', () => {
    cy.intercept('GET', ROTA_LISTA, { body: consultasMock }).as('listar')
    cy.intercept('POST', '**/api/sintomas/', {
      statusCode: 201,
      body: {
        id: 60,
        data: '2026-05-10',
        tipo: 'cólica',
        descricao: 'leve à tarde',
        intensidade: 2,
      },
    }).as('criarSintoma')
    visitarConsultas()
    cy.wait('@listar')

    cy.get('[data-cy=calendario-mes-dia][data-dia="10"]')
      .find('[data-cy=calendario-mes-dia-botao]')
      .click()
    cy.get('[data-cy=calendario-dia-registrar-sintoma]').click()
    cy.get('[data-cy=calendario-dia-form-sintoma]').should('be.visible')
    cy.get('[data-cy=calendario-dia-sintoma-tipo]').type('cólica')
    cy.get('[data-cy=calendario-dia-sintoma-descricao]').type('leve à tarde')
    cy.get('[data-cy=calendario-dia-sintoma-salvar]').click()

    cy.wait('@criarSintoma').its('request.body').should((body) => {
      expect(body.data).to.eq('2026-05-10')
      expect(body.tipo).to.eq('cólica')
      expect(body.descricao).to.eq('leve à tarde')
    })
    cy.get('[data-cy=calendario-dia-drawer]').should('not.exist')
    cy.get('[data-cy=toast]').should('be.visible')
  })

  it('valida o sintoma no drawer sem chamar a API', () => {
    cy.intercept('GET', ROTA_LISTA, { body: consultasMock }).as('listar')
    visitarConsultas()
    cy.wait('@listar')

    cy.get('[data-cy=calendario-mes-dia][data-dia="10"]')
      .find('[data-cy=calendario-mes-dia-botao]')
      .click()
    cy.get('[data-cy=calendario-dia-registrar-sintoma]').click()
    // Salvar sem tipo/descrição é bloqueado no cliente.
    cy.get('[data-cy=calendario-dia-sintoma-salvar]').click()
    cy.get('[data-cy=calendario-dia-erro]')
      .should('be.visible')
      .and('contain', 'Preencha o tipo e a descrição')
  })

  it('permite voltar do formulário de registro sem salvar', () => {
    cy.intercept('GET', ROTA_LISTA, { body: consultasMock }).as('listar')
    visitarConsultas()
    cy.wait('@listar')

    cy.get('[data-cy=calendario-mes-dia][data-dia="10"]')
      .find('[data-cy=calendario-mes-dia-botao]')
      .click()
    cy.get('[data-cy=calendario-dia-registrar-ciclo]').click()
    cy.get('[data-cy=calendario-dia-form-ciclo]').should('be.visible')
    cy.get('[data-cy=calendario-dia-registrar-voltar]').click()
    cy.get('[data-cy=calendario-dia-form-ciclo]').should('not.exist')
    cy.get('[data-cy=calendario-dia-registrar-ciclo]').should('be.visible')
  })
})

describe('Banner de próxima consulta na Home', () => {
  beforeEach(() => {
    cy.clearLocalStorage()
    fixarDataAtual()
    cy.intercept('GET', '**/api/medicamentos/', { body: [] })
  })

  it('renderiza com data, especialidade e médica quando há próxima consulta', () => {
    cy.intercept('GET', ROTA_PROXIMAS, { body: proximasMock }).as('proximas')
    visitarConsultas('/')
    cy.wait('@proximas')

    cy.get('[data-cy=banner-proxima-consulta]')
      .should('be.visible')
      .within(() => {
        cy.contains('Próxima consulta').should('be.visible')
        cy.contains('Reprodução humana').should('be.visible')
        cy.contains('Dra. Helena Costa').should('be.visible')
      })

    cy.get('[data-cy=banner-proxima-consulta-restantes]')
      .should('be.visible')
      .and('contain', '+1 outra consulta')
    cy.get('[data-cy=banner-proxima-consulta-link]').should(
      'have.attr',
      'href',
      '/calendario',
    )
  })

  it('não aparece quando a API de próximas retorna lista vazia', () => {
    cy.intercept('GET', ROTA_PROXIMAS, { body: [] }).as('proximas')
    visitarConsultas('/')
    cy.wait('@proximas')

    cy.get('[data-cy=home-page]').should('be.visible')
    cy.get('[data-cy=banner-proxima-consulta]').should('not.exist')
  })
})
