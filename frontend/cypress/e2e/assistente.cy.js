const ROTA_ASSISTENTE = '**/api/assistente/'

// O Assistente Amare (PR 9) vive dentro do AppLayout protegido. Ele é guiado e
// seguro: responde com conteúdo da própria Amare (com fonte e atalhos) e, em
// tema sensível, encaminha para a clínica — nunca diagnostica nem ajusta dose.
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

function visitarBot(rota = '/bot') {
  return cy.visit(rota, {
    onBeforeLoad(janela) {
      janela.localStorage.setItem('marea_auth', JSON.stringify(SESSAO_FAKE))
    },
  })
}

const DISCLAIMER =
  'O Assistente Amare ajuda com informações gerais da Amare e não substitui a ' +
  'orientação da sua equipe médica. Ele não faz diagnósticos nem ajusta doses ' +
  'de medicação.'

const SUGESTOES = {
  disclaimer: DISCLAIMER,
  sugestoes: [
    {
      intencao: 'consultas',
      pergunta_exemplo: 'Como vejo minhas próximas consultas?',
      categoria: 'Agenda',
    },
    {
      intencao: 'medicamentos',
      pergunta_exemplo: 'Onde acompanho meus medicamentos?',
      categoria: 'Medicação',
    },
  ],
}

const RESPOSTA_CONSULTAS = {
  intencao: 'consultas',
  encontrou: true,
  resposta:
    'Suas consultas ficam no calendário da Amare, com data, horário e local.',
  sensivel: false,
  fonte: { rotulo: 'Calendário', rota: '/calendario' },
  acoes: [{ rotulo: 'Ver calendário', rota: '/calendario' }],
  disclaimer: DISCLAIMER,
}

const RESPOSTA_SENSIVEL = {
  intencao: null,
  encontrou: false,
  resposta:
    'Esse assunto é importante e precisa da avaliação de alguém da equipe. ' +
    'Não posso orientar sobre sintomas, diagnósticos ou mudanças na medicação. ' +
    'Fale com a Clínica Amare pelo (81) 3000-0000.',
  sensivel: true,
  fonte: null,
  acoes: [],
  disclaimer: DISCLAIMER,
}

const RESPOSTA_SEM_MATCH = {
  intencao: null,
  encontrou: false,
  resposta:
    'Ainda não sei responder isso por aqui. Você pode reformular a pergunta, ' +
    'escolher uma das sugestões ou falar com a clínica.',
  sensivel: false,
  fonte: null,
  acoes: [],
  disclaimer: DISCLAIMER,
}

describe('Assistente Amare da Amare', () => {
  it('exibe título, aviso fixo, boas-vindas e perguntas sugeridas', () => {
    cy.intercept('GET', ROTA_ASSISTENTE, { body: SUGESTOES }).as('sugestoes')
    visitarBot()
    cy.wait('@sugestoes')

    cy.get('[data-cy=page-bot]').should('be.visible')
    cy.contains('h1', 'Assistente Amare').should('be.visible')
    cy.get('[data-cy=bot-disclaimer]')
      .should('be.visible')
      .and('contain', 'não substitui')
    cy.get('[data-cy=bot-boas-vindas]').should('be.visible')
    cy.get('[data-cy=bot-sugestao]').should('have.length', 2)
    cy.get('[data-cy=bot-form]').should('be.visible')
  })

  it('responde a uma sugestão com a fonte e os atalhos', () => {
    cy.intercept('GET', ROTA_ASSISTENTE, { body: SUGESTOES }).as('sugestoes')
    cy.intercept('POST', ROTA_ASSISTENTE, { body: RESPOSTA_CONSULTAS }).as(
      'perguntar',
    )
    visitarBot()
    cy.wait('@sugestoes')

    cy.get('[data-cy=bot-sugestao]').first().click()
    cy.wait('@perguntar')

    cy.get('[data-cy=bot-mensagem-usuaria]').should(
      'contain',
      'Como vejo minhas próximas consultas?',
    )
    cy.get('[data-cy=bot-mensagem-assistente]').should('be.visible')
    cy.get('[data-cy=bot-resposta]').should('contain', 'calendário da Amare')
    cy.get('[data-cy=bot-fonte]')
      .should('contain', 'Calendário')
      .and('have.attr', 'href', '/calendario')
    cy.get('[data-cy=bot-acao]')
      .should('contain', 'Ver calendário')
      .and('have.attr', 'href', '/calendario')
    // O estado de boas-vindas some quando a conversa começa.
    cy.get('[data-cy=bot-boas-vindas]').should('not.exist')
  })

  it('responde a uma pergunta digitada livremente', () => {
    cy.intercept('GET', ROTA_ASSISTENTE, { body: SUGESTOES }).as('sugestoes')
    cy.intercept('POST', ROTA_ASSISTENTE, { body: RESPOSTA_CONSULTAS }).as(
      'perguntar',
    )
    visitarBot()
    cy.wait('@sugestoes')

    cy.get('[data-cy=bot-input]').type('quando é minha consulta?')
    cy.get('[data-cy=bot-enviar]').click()
    cy.wait('@perguntar')

    cy.get('[data-cy=bot-mensagem-usuaria]').should(
      'contain',
      'quando é minha consulta?',
    )
    cy.get('[data-cy=bot-resposta]').should('be.visible')
    // O campo é limpo após o envio.
    cy.get('[data-cy=bot-input]').should('have.value', '')
  })

  it('encaminha temas sensíveis para a clínica, sem fonte nem atalhos', () => {
    cy.intercept('GET', ROTA_ASSISTENTE, { body: SUGESTOES }).as('sugestoes')
    cy.intercept('POST', ROTA_ASSISTENTE, { body: RESPOSTA_SENSIVEL }).as(
      'perguntar',
    )
    visitarBot()
    cy.wait('@sugestoes')

    cy.get('[data-cy=bot-input]').type('Posso parar de tomar a progesterona?')
    cy.get('[data-cy=bot-enviar]').click()
    cy.wait('@perguntar')

    cy.get('[data-cy=bot-sensivel]')
      .should('be.visible')
      .and('contain', 'Procure a clínica')
    cy.get('[data-cy=bot-resposta]')
      .should('contain', 'avaliação de alguém da equipe')
      .and('contain', '(81) 3000-0000')
    cy.get('[data-cy=bot-fonte]').should('not.exist')
    cy.get('[data-cy=bot-acao]').should('not.exist')
  })

  it('mostra a resposta segura quando nada casa', () => {
    cy.intercept('GET', ROTA_ASSISTENTE, { body: SUGESTOES }).as('sugestoes')
    cy.intercept('POST', ROTA_ASSISTENTE, { body: RESPOSTA_SEM_MATCH }).as(
      'perguntar',
    )
    visitarBot()
    cy.wait('@sugestoes')

    cy.get('[data-cy=bot-input]').type('qual a capital da França?')
    cy.get('[data-cy=bot-enviar]').click()
    cy.wait('@perguntar')

    cy.get('[data-cy=bot-resposta]').should('contain', 'Ainda não sei responder')
    cy.get('[data-cy=bot-fonte]').should('not.exist')
  })

  it('avisa com toast quando a resposta falha', () => {
    cy.intercept('GET', ROTA_ASSISTENTE, { body: SUGESTOES }).as('sugestoes')
    cy.intercept('POST', ROTA_ASSISTENTE, { statusCode: 500, body: {} }).as(
      'falha',
    )
    visitarBot()
    cy.wait('@sugestoes')

    cy.get('[data-cy=bot-input]').type('oi')
    cy.get('[data-cy=bot-enviar]').click()
    cy.wait('@falha')

    cy.get('[data-cy=toast]').should('be.visible')
    cy.get('[data-cy=bot-mensagem-assistente]').should(
      'contain',
      'Tive um problema para responder',
    )
  })

  it('exibe erro quando o assistente não carrega', () => {
    cy.intercept('GET', ROTA_ASSISTENTE, { statusCode: 500, body: {} }).as(
      'falha',
    )
    visitarBot()
    cy.wait('@falha')

    cy.get('[data-cy=bot-erro]')
      .should('be.visible')
      .and('contain', 'Não foi possível carregar o assistente')
    // Mesmo sem sugestões, o aviso fixo e o campo de pergunta seguem visíveis.
    cy.get('[data-cy=bot-disclaimer]').should('be.visible')
    cy.get('[data-cy=bot-form]').should('be.visible')
  })

  it('funciona no celular (viewport mobile)', () => {
    cy.viewport(375, 667)
    cy.intercept('GET', ROTA_ASSISTENTE, { body: SUGESTOES }).as('sugestoes')
    cy.intercept('POST', ROTA_ASSISTENTE, { body: RESPOSTA_CONSULTAS }).as(
      'perguntar',
    )
    visitarBot()
    cy.wait('@sugestoes')

    cy.get('[data-cy=bot-sugestao]').first().click()
    cy.wait('@perguntar')

    cy.get('[data-cy=page-bot]').should('be.visible')
    cy.get('[data-cy=bot-mensagem-assistente]').should('be.visible')
    // Sem rolagem horizontal: o conteúdo cabe na largura da viewport.
    cy.document().then((doc) => {
      expect(doc.documentElement.scrollWidth).to.be.lte(375)
    })
  })
})
