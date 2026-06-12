const ROTA_LISTA = '**/api/jornada/'

// A página /linha-do-tempo vive dentro do AppLayout protegido. A jornada é
// escopada por dono no backend; aqui mockamos a resposta da paciente logada.
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

function visitarLinhaDoTempo(rota = '/linha-do-tempo') {
  return cy.visit(rota, {
    onBeforeLoad(janela) {
      janela.localStorage.setItem('marea_auth', JSON.stringify(SESSAO_FAKE))
    },
  })
}

const jornadaMock = [
  {
    id: 1,
    status: 'concluida',
    status_label: 'Concluída',
    observacao: '',
    etapa: 1,
    etapa_titulo: 'Avaliação inicial',
    etapa_descricao: 'Consultas e exames iniciais.',
    etapa_ordem: 1,
    tratamento_nome: 'Fertilização in vitro (FIV)',
  },
  {
    id: 2,
    status: 'atual',
    status_label: 'Atual',
    observacao: '',
    etapa: 2,
    etapa_titulo: 'Estimulação ovariana',
    etapa_descricao: 'Uso de medicação acompanhado por ultrassom.',
    etapa_ordem: 2,
    tratamento_nome: 'Fertilização in vitro (FIV)',
  },
  {
    id: 3,
    status: 'futura',
    status_label: 'Futura',
    observacao: '',
    etapa: 3,
    etapa_titulo: 'Coleta dos óvulos',
    etapa_descricao: 'Procedimento com sedação.',
    etapa_ordem: 3,
    tratamento_nome: 'Fertilização in vitro (FIV)',
  },
]

describe('Linha do tempo da Amare', () => {
  it('exibe o título da página', () => {
    cy.intercept('GET', ROTA_LISTA, { body: jornadaMock }).as('listar')
    visitarLinhaDoTempo()
    cy.wait('@listar')
    cy.get('[data-cy=page-linha-do-tempo]').should('be.visible')
    cy.contains('h1', 'Linha do tempo').should('be.visible')
  })

  it('mostra as etapas em ordem com o nome do tratamento', () => {
    cy.intercept('GET', ROTA_LISTA, { body: jornadaMock }).as('listar')
    visitarLinhaDoTempo()
    cy.wait('@listar')

    cy.get('[data-cy=linha-do-tempo-tratamento]').should(
      'contain',
      'Fertilização in vitro (FIV)',
    )
    cy.get('[data-cy=linha-do-tempo-item]').should('have.length', 3)
    cy.get('[data-cy=linha-do-tempo-item]')
      .first()
      .should('contain', 'Avaliação inicial')
    cy.get('[data-cy=linha-do-tempo-item]')
      .last()
      .should('contain', 'Coleta dos óvulos')
  })

  it('destaca a etapa atual', () => {
    cy.intercept('GET', ROTA_LISTA, { body: jornadaMock }).as('listar')
    visitarLinhaDoTempo()
    cy.wait('@listar')

    cy.get('[data-cy=linha-do-tempo-item][data-status="atual"]')
      .should('have.length', 1)
      .should('have.attr', 'aria-current', 'step')
      .within(() => {
        cy.contains('Estimulação ovariana').should('be.visible')
        cy.get('[data-cy=linha-do-tempo-item-status]').should('contain', 'Atual')
      })
  })

  it('mostra o painel "O que fazer agora" só na etapa atual, com os atalhos', () => {
    cy.intercept('GET', ROTA_LISTA, { body: jornadaMock }).as('listar')
    visitarLinhaDoTempo()
    cy.wait('@listar')

    cy.get('[data-cy=linha-do-tempo-item][data-status="atual"]').within(() => {
      cy.get('[data-cy=linha-do-tempo-acoes]')
        .should('be.visible')
        .and('contain', 'O que fazer agora')
      cy.get('[data-cy=linha-do-tempo-acao-calendario]').should(
        'have.attr',
        'href',
        '/calendario',
      )
      cy.get('[data-cy=linha-do-tempo-acao-medicamentos]').should(
        'have.attr',
        'href',
        '/medicamentos',
      )
      cy.get('[data-cy=linha-do-tempo-acao-sintomas]').should(
        'have.attr',
        'href',
        '/sintomas',
      )
      cy.get('[data-cy=linha-do-tempo-acao-ciclo]').should(
        'have.attr',
        'href',
        '/ciclo',
      )
      cy.get('[data-cy=linha-do-tempo-acao-orientacoes]').should(
        'have.attr',
        'href',
        '/orientacoes',
      )
    })

    // Concluída e futura não têm o painel de ações.
    cy.get('[data-cy=linha-do-tempo-item][data-status="concluida"]').within(
      () => {
        cy.get('[data-cy=linha-do-tempo-acoes]').should('not.exist')
      },
    )
    cy.get('[data-cy=linha-do-tempo-item][data-status="futura"]').within(() => {
      cy.get('[data-cy=linha-do-tempo-acoes]').should('not.exist')
    })
  })

  it('atalho da etapa atual leva à área correspondente', () => {
    cy.intercept('GET', ROTA_LISTA, { body: jornadaMock }).as('listar')
    cy.intercept('GET', '**/api/ciclo/registros/', { body: [] })
    cy.intercept('GET', '**/api/ciclo/previsoes/', {
      body: { tem_dados: false },
    })
    visitarLinhaDoTempo()
    cy.wait('@listar')

    cy.get('[data-cy=linha-do-tempo-acao-ciclo]').click()
    cy.location('pathname').should('eq', '/ciclo')
  })

  it('expande e recolhe as etapas ao tocar no cabeçalho', () => {
    cy.intercept('GET', ROTA_LISTA, { body: jornadaMock }).as('listar')
    visitarLinhaDoTempo()
    cy.wait('@listar')

    // A etapa atual começa aberta: o painel de ações aparece e o toggle marca
    // aria-expanded=true. Ao tocar, recolhe e o painel some.
    cy.get('[data-cy=linha-do-tempo-item][data-status="atual"]').within(() => {
      cy.get('[data-cy=linha-do-tempo-acoes]').should('be.visible')
      cy.get('[data-cy=linha-do-tempo-item-toggle]')
        .should('have.attr', 'aria-expanded', 'true')
        .click()
      cy.get('[data-cy=linha-do-tempo-item-toggle]').should(
        'have.attr',
        'aria-expanded',
        'false',
      )
      cy.get('[data-cy=linha-do-tempo-acoes]').should('not.exist')
    })

    // Uma etapa concluída começa recolhida (a descrição nem está no DOM) e
    // expande ao tocar no cabeçalho.
    cy.get('[data-cy=linha-do-tempo-item][data-status="concluida"]').within(
      () => {
        cy.contains('Consultas e exames iniciais.').should('not.exist')
        cy.get('[data-cy=linha-do-tempo-item-toggle]')
          .should('have.attr', 'aria-expanded', 'false')
          .click()
        cy.contains('Consultas e exames iniciais.').should('be.visible')
      },
    )
  })

  it('exibe mensagem quando não há etapas', () => {
    cy.intercept('GET', ROTA_LISTA, { body: [] }).as('listar')
    visitarLinhaDoTempo()
    cy.wait('@listar')
    cy.get('[data-cy=linha-do-tempo-mensagem-vazia]')
      .should('be.visible')
      .and('contain', 'Nenhuma etapa cadastrada')
  })

  it('exibe mensagem de erro quando a API falha', () => {
    cy.intercept('GET', ROTA_LISTA, { statusCode: 500, body: {} }).as('falha')
    visitarLinhaDoTempo()
    cy.wait('@falha')
    cy.get('[data-cy=linha-do-tempo-mensagem-erro]')
      .should('be.visible')
      .and('contain', 'Não foi possível carregar a linha do tempo no momento.')
  })
})
