describe('Rotas e layout base da Amare', () => {
  // Páginas ainda em placeholder. Dicionário, Perfil, Calendário,
  // Medicamentos, Tratamentos, Orientações e Especialidades foram removidos
  // daqui porque agora têm implementação real (ver os specs correspondentes).
  const paginasPlaceholder = [
    { rota: '/ciclo', titulo: 'Ciclo', dataCy: 'nav-ciclo' },
    { rota: '/bot', titulo: 'Bot', dataCy: 'nav-bot' },
  ]

  // Sessão fake usada para passar pela ProtectedRoute durante os testes.
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

  function visitarAutenticado(rota) {
    return cy.visit(rota, {
      onBeforeLoad(janela) {
        janela.localStorage.setItem('marea_auth', JSON.stringify(SESSAO_FAKE))
      },
    })
  }

  beforeEach(() => {
    cy.clearLocalStorage()
    // Mocks padrões para qualquer rota interna que dependa de API real.
    cy.intercept('GET', '**/api/dicionario/termos/**', { body: [] })
    cy.intercept('GET', '**/api/consultas/proximas/', { body: [] })
    cy.intercept('GET', '**/api/consultas/', { body: [] })
    cy.intercept('GET', '**/api/medicamentos/', { body: [] })
    cy.intercept('GET', '**/api/tratamentos/**', { body: [] })
    cy.intercept('GET', '**/api/orientacoes/**', { body: [] })
    cy.intercept('GET', '**/api/especialidades/', { body: [] })
    cy.intercept('GET', '**/api/eventos/', { body: [] })
    cy.intercept('GET', '**/api/jornada/', { body: [] })
    cy.intercept('GET', '**/api/apoio/**', { body: [] })
    cy.intercept('GET', '**/api/perfil/', {
      body: {
        username: 'paciente_teste',
        email: 'paciente@amare.test',
        tipo_usuario: 'paciente',
        nome_completo: 'Júlia Pereira',
        telefone: '(81) 91234-5678',
        foto_url: '',
        data_nascimento: '1993-04-12',
        tipo_sanguineo: 'O+',
        medicamentos_em_uso: '',
        observacoes_medicas: '',
      },
    })
  })

  it('carrega a tela de login na rota /login sem sidebar', () => {
    cy.visit('/login')

    cy.get('[data-cy=auth-layout]').should('be.visible')
    cy.get('.login-card').should('be.visible')
    cy.get('[data-cy=app-sidebar]').should('not.exist')
    cy.get('[data-cy=app-header]').should('not.exist')
  })

  it('carrega a Home com sidebar, header e busca quando autenticado', () => {
    visitarAutenticado('/')

    cy.get('[data-cy=app-layout]').should('be.visible')
    cy.get('[data-cy=home-page]').should('be.visible')
    cy.contains('h1', 'Bem-vinda à Amare').should('be.visible')
    cy.get('[data-cy=app-sidebar]').should('be.visible')
    cy.get('[data-cy=app-header]').should('be.visible')
    cy.get('[data-cy=app-search]').should('be.visible')
    cy.get('[data-cy=app-search] input').should(
      'have.attr',
      'placeholder',
      'Buscar na Amare',
    )
  })

  it('redireciona para /login quando tenta acessar rota interna sem sessao', () => {
    cy.visit('/')
    cy.location('pathname').should('eq', '/login')
  })

  it('navega pelos links da sidebar para as paginas corretas', () => {
    visitarAutenticado('/')

    cy.get('[data-cy=nav-home]').should('have.attr', 'href', '/')
    cy.get('[data-cy=nav-home]').click()
    cy.location('pathname').should('eq', '/')
    cy.contains('h1', 'Bem-vinda à Amare').should('be.visible')

    paginasPlaceholder.forEach((pagina) => {
      cy.get(`[data-cy=${pagina.dataCy}]`).should(
        'have.attr',
        'href',
        pagina.rota,
      )
      cy.get(`[data-cy=${pagina.dataCy}]`).click()
      cy.location('pathname').should('eq', pagina.rota)
      cy.contains('h1', pagina.titulo).should('be.visible')
      cy.contains('Esta página será desenvolvida em uma próxima etapa.').should(
        'be.visible',
      )
    })

    // Dicionário, Perfil e Calendário são rotas reais; a navegação ainda
    // funciona, mas o conteúdo é a página correspondente — não o placeholder.
    cy.get('[data-cy=nav-dicionario]').should(
      'have.attr',
      'href',
      '/dicionario',
    )
    cy.get('[data-cy=nav-dicionario]').click()
    cy.location('pathname').should('eq', '/dicionario')
    cy.contains('h1', 'Dicionário').should('be.visible')

    cy.get('[data-cy=nav-perfil]').should('have.attr', 'href', '/perfil')
    cy.get('[data-cy=nav-perfil]').click()
    cy.location('pathname').should('eq', '/perfil')
    cy.contains('h1', 'Perfil').should('be.visible')

    cy.get('[data-cy=nav-calendario]').should(
      'have.attr',
      'href',
      '/calendario',
    )
    cy.get('[data-cy=nav-calendario]').click()
    cy.location('pathname').should('eq', '/calendario')
    cy.contains('h1', 'Calendário').should('be.visible')
    cy.get('[data-cy=calendario-mes]').should('be.visible')

    cy.get('[data-cy=nav-medicamentos]').should(
      'have.attr',
      'href',
      '/medicamentos',
    )
    cy.get('[data-cy=nav-medicamentos]').click()
    cy.location('pathname').should('eq', '/medicamentos')
    cy.contains('h1', 'Medicamentos').should('be.visible')

    cy.get('[data-cy=nav-tratamentos]').should(
      'have.attr',
      'href',
      '/tratamentos',
    )
    cy.get('[data-cy=nav-tratamentos]').click()
    cy.location('pathname').should('eq', '/tratamentos')
    cy.contains('h1', 'Tratamentos').should('be.visible')

    cy.get('[data-cy=nav-orientacoes]').should(
      'have.attr',
      'href',
      '/orientacoes',
    )
    cy.get('[data-cy=nav-orientacoes]').click()
    cy.location('pathname').should('eq', '/orientacoes')
    cy.contains('h1', 'Orientações').should('be.visible')

    cy.get('[data-cy=nav-especialidades]').should(
      'have.attr',
      'href',
      '/especialidades',
    )
    cy.get('[data-cy=nav-especialidades]').click()
    cy.location('pathname').should('eq', '/especialidades')
    cy.contains('h1', 'Especialidades').should('be.visible')

    cy.get('[data-cy=nav-linha-do-tempo]').should(
      'have.attr',
      'href',
      '/linha-do-tempo',
    )
    cy.get('[data-cy=nav-linha-do-tempo]').click()
    cy.location('pathname').should('eq', '/linha-do-tempo')
    cy.contains('h1', 'Linha do tempo').should('be.visible')

    cy.get('[data-cy=nav-apoio]').should('have.attr', 'href', '/apoio')
    cy.get('[data-cy=nav-apoio]').click()
    cy.location('pathname').should('eq', '/apoio')
    cy.contains('h1', 'Apoio emocional').should('be.visible')
  })

  it('abre Bot corretamente por rota direta', () => {
    visitarAutenticado('/bot')
    cy.get('[data-cy=app-layout]').should('be.visible')
    cy.get('[data-cy=app-search]').should('be.visible')
    cy.contains('h1', 'Bot').should('be.visible')
    cy.contains('Esta página será desenvolvida em uma próxima etapa.').should(
      'be.visible',
    )
  })

  it('mostra título e texto básico nas páginas placeholder', () => {
    paginasPlaceholder.forEach((pagina) => {
      visitarAutenticado(pagina.rota)
      cy.get('[data-cy=placeholder-page]').should('be.visible')
      cy.contains('h1', pagina.titulo).should('be.visible')
      cy.contains('Esta página será desenvolvida em uma próxima etapa.').should(
        'be.visible',
      )
    })
  })
})
