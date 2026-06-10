const ROTA_REGISTROS = '**/api/ciclo/registros/'
const ROTA_REGISTRO = '**/api/ciclo/registros/*'
const ROTA_PREVISOES = '**/api/ciclo/previsoes/'

// O ciclo menstrual (PROJ-5 registro, PROJ-6 previsões) vive dentro do
// AppLayout protegido. A paciente registra/edita/exclui os próprios registros e
// vê uma estimativa do próximo ciclo.
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

function visitarCiclo(rota = '/ciclo') {
  return cy.visit(rota, {
    onBeforeLoad(janela) {
      janela.localStorage.setItem('marea_auth', JSON.stringify(SESSAO_FAKE))
    },
  })
}

const registrosMock = [
  {
    id: 1,
    data: '2026-05-01',
    etapa: 'menstruacao',
    etapa_display: 'Menstruação',
    observacoes: 'Início do período.',
    status: 'concluido',
    status_display: 'Concluído',
    criado_em: '2026-05-01T10:00:00Z',
    atualizado_em: '2026-05-01T10:00:00Z',
  },
]

const previsoesComDados = {
  tem_dados: true,
  ciclo_medio_dias: 28,
  proxima_menstruacao: '2026-06-26',
  ovulacao_estimada: '2026-06-12',
  janela_fertil_inicio: '2026-06-08',
  janela_fertil_fim: '2026-06-13',
  etapa_atual: 'ovulacao',
  etapa_atual_display: 'Fase ovulatória',
  dia_do_ciclo: 13,
  total_do_ciclo: 28,
  dias_para_proxima: 14,
  atrasada: false,
  chance_gravidez: 'alta',
  aviso: 'Estimativa baseada nos seus registros. Não substitui a orientação da equipe médica.',
}

const previsoesVazia = {
  tem_dados: false,
  mensagem:
    'Ainda não há registros suficientes de menstruação para gerar previsões.',
  aviso: 'Estimativa baseada nos seus registros. Não substitui a orientação da equipe médica.',
}

describe('Meu ciclo da Amare', () => {
  it('exibe título, formulário e o aviso das previsões', () => {
    cy.intercept('GET', ROTA_REGISTROS, { body: [] }).as('listar')
    cy.intercept('GET', ROTA_PREVISOES, { body: previsoesVazia }).as('prever')
    visitarCiclo()
    cy.wait('@listar')
    cy.wait('@prever')

    cy.get('[data-cy=page-ciclo]').should('be.visible')
    cy.contains('h1', 'Meu ciclo').should('be.visible')
    cy.get('[data-cy=ciclo-form]').should('be.visible')
    cy.get('[data-cy=ciclo-previsoes]').should('be.visible')
    cy.get('[data-cy=ciclo-aviso]')
      .should('be.visible')
      .and('contain', 'Não substitui a orientação da equipe médica')
  })

  it('mostra a próxima menstruação quando há dados suficientes', () => {
    cy.intercept('GET', ROTA_REGISTROS, { body: registrosMock }).as('listar')
    cy.intercept('GET', ROTA_PREVISOES, { body: previsoesComDados }).as('prever')
    visitarCiclo()
    cy.wait('@listar')
    cy.wait('@prever')

    cy.get('[data-cy=ciclo-previsao-proxima]')
      .should('be.visible')
      .and('contain', '26/06/2026')
    cy.get('[data-cy=ciclo-previsao-fertil]').should('contain', '08/06/2026')
  })

  it('mostra os registros existentes', () => {
    cy.intercept('GET', ROTA_REGISTROS, { body: registrosMock }).as('listar')
    cy.intercept('GET', ROTA_PREVISOES, { body: previsoesVazia }).as('prever')
    visitarCiclo()
    cy.wait('@listar')

    cy.get('[data-cy=ciclo-item]').should('have.length', 1)
    cy.get('[data-cy=ciclo-lista]')
      .should('contain', 'Menstruação')
      .and('contain', 'Início do período.')
  })

  it('mostra mensagem quando não há registros nem previsão', () => {
    cy.intercept('GET', ROTA_REGISTROS, { body: [] }).as('listar')
    cy.intercept('GET', ROTA_PREVISOES, { body: previsoesVazia }).as('prever')
    visitarCiclo()
    cy.wait('@listar')

    cy.get('[data-cy=ciclo-vazia]').should('be.visible')
    cy.get('[data-cy=ciclo-previsao-vazia]').should('be.visible')
  })

  it('cria um novo registro e ele aparece na lista', () => {
    cy.intercept('GET', ROTA_REGISTROS, { body: [] }).as('listar')
    cy.intercept('GET', ROTA_PREVISOES, { body: previsoesVazia }).as('prever')
    visitarCiclo()
    cy.wait('@listar')

    cy.intercept('POST', ROTA_REGISTROS, {
      statusCode: 201,
      body: {
        id: 9,
        data: '2026-06-05',
        etapa: 'menstruacao',
        etapa_display: 'Menstruação',
        observacoes: 'Novo ciclo.',
        status: 'registrado',
        status_display: 'Registrado',
        criado_em: '2026-06-05T10:00:00Z',
        atualizado_em: '2026-06-05T10:00:00Z',
      },
    }).as('criar')

    // Etapa e status já vêm com padrão (menstruação / registrado).
    cy.get('[data-cy=ciclo-observacoes]').type('Novo ciclo.')
    cy.get('[data-cy=ciclo-enviar]').click()
    cy.wait('@criar')

    cy.get('[data-cy=ciclo-sucesso]').should('be.visible')
    cy.get('[data-cy=ciclo-item]').should('have.length', 1)
    cy.get('[data-cy=ciclo-lista]').should('contain', 'Novo ciclo.')
  })

  it('edita um registro existente', () => {
    cy.intercept('GET', ROTA_REGISTROS, { body: registrosMock }).as('listar')
    cy.intercept('GET', ROTA_PREVISOES, { body: previsoesVazia }).as('prever')
    visitarCiclo()
    cy.wait('@listar')

    cy.intercept('PATCH', ROTA_REGISTRO, {
      statusCode: 200,
      body: {
        ...registrosMock[0],
        observacoes: 'Observação editada.',
      },
    }).as('atualizar')

    cy.get('[data-cy=ciclo-item-editar]').click()
    cy.contains('h2', 'Editar registro').should('be.visible')
    cy.get('[data-cy=ciclo-observacoes]').clear().type('Observação editada.')
    cy.get('[data-cy=ciclo-enviar]').click()
    cy.wait('@atualizar')

    cy.get('[data-cy=ciclo-sucesso]')
      .should('be.visible')
      .and('contain', 'atualizado')
    cy.get('[data-cy=ciclo-lista]').should('contain', 'Observação editada.')
  })

  it('exclui um registro com confirmação', () => {
    cy.intercept('GET', ROTA_REGISTROS, { body: registrosMock }).as('listar')
    cy.intercept('GET', ROTA_PREVISOES, { body: previsoesVazia }).as('prever')
    visitarCiclo()
    cy.wait('@listar')

    cy.intercept('DELETE', ROTA_REGISTRO, { statusCode: 204 }).as('excluir')

    cy.get('[data-cy=ciclo-item-excluir]').click()
    cy.get('[data-cy=ciclo-confirmar-exclusao]').should('be.visible')
    cy.get('[data-cy=ciclo-confirmar-sim]').click()
    cy.wait('@excluir')

    cy.get('[data-cy=ciclo-item]').should('not.exist')
    cy.get('[data-cy=ciclo-vazia]').should('be.visible')
  })

  it('valida campos obrigatórios sem chamar a API', () => {
    cy.intercept('GET', ROTA_REGISTROS, { body: [] }).as('listar')
    cy.intercept('GET', ROTA_PREVISOES, { body: previsoesVazia }).as('prever')
    visitarCiclo()
    cy.wait('@listar')

    // Limpando a data, o envio é bloqueado no cliente.
    cy.get('[data-cy=ciclo-data]').clear()
    cy.get('[data-cy=ciclo-enviar]').click()
    cy.get('[data-cy=ciclo-erro-envio]')
      .should('be.visible')
      .and('contain', 'Informe a data')
  })

  it('exibe erro quando o carregamento falha', () => {
    cy.intercept('GET', ROTA_REGISTROS, { statusCode: 500, body: {} }).as(
      'falha',
    )
    cy.intercept('GET', ROTA_PREVISOES, { body: previsoesVazia })
    visitarCiclo()
    cy.wait('@falha')
    cy.get('[data-cy=ciclo-erro]')
      .should('be.visible')
      .and('contain', 'Não foi possível carregar seu ciclo no momento.')
  })

  it('exibe o anel de fase, a chance de gravidez e o calendário', () => {
    cy.intercept('GET', ROTA_REGISTROS, { body: registrosMock }).as('listar')
    cy.intercept('GET', ROTA_PREVISOES, { body: previsoesComDados }).as('prever')
    visitarCiclo()
    cy.wait('@listar')
    cy.wait('@prever')

    cy.get('[data-cy=ciclo-anel]').should('be.visible')
    cy.get('[data-cy=ciclo-fase]').should('contain', 'Fase ovulatória')
    cy.get('[data-cy=ciclo-dia]').should('contain', '13')
    cy.get('[data-cy=ciclo-chance]')
      .should('be.visible')
      .and('contain', 'Alta')
    cy.get('[data-cy=calendario-mes]').should('be.visible')
  })

  it('mostra o estado vazio do anel quando faltam dados', () => {
    cy.intercept('GET', ROTA_REGISTROS, { body: [] }).as('listar')
    cy.intercept('GET', ROTA_PREVISOES, { body: previsoesVazia }).as('prever')
    visitarCiclo()
    cy.wait('@listar')

    cy.get('[data-cy=ciclo-anel-vazio]').should('be.visible')
    cy.get('[data-cy=ciclo-anel]').should('not.exist')
  })

  it('tem atalhos de registro e leva ao formulário', () => {
    cy.intercept('GET', ROTA_REGISTROS, { body: [] }).as('listar')
    cy.intercept('GET', ROTA_PREVISOES, { body: previsoesVazia }).as('prever')
    visitarCiclo()
    cy.wait('@listar')

    cy.get('[data-cy=ciclo-acao-sintomas]').should(
      'have.attr',
      'href',
      '/sintomas',
    )
    cy.get('[data-cy=ciclo-acao-menstruacao]').click()
    cy.get('[data-cy=ciclo-form]').should('be.visible')
    cy.contains('h2', 'Novo registro').should('be.visible')
  })

  it('funciona no celular (viewport mobile)', () => {
    cy.viewport(375, 667)
    cy.intercept('GET', ROTA_REGISTROS, { body: registrosMock }).as('listar')
    cy.intercept('GET', ROTA_PREVISOES, { body: previsoesComDados }).as('prever')
    visitarCiclo()
    cy.wait('@listar')

    cy.get('[data-cy=page-ciclo]').should('be.visible')
    cy.get('[data-cy=ciclo-form]').should('be.visible')
    cy.get('[data-cy=ciclo-item]').should('be.visible')
    // Sem rolagem horizontal: o conteúdo cabe na largura da viewport.
    cy.document().then((doc) => {
      expect(doc.documentElement.scrollWidth).to.be.lte(375)
    })
  })
})
