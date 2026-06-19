describe('Rotas e layout base da Amare', () => {
  // Todas as páginas do menu principal já têm implementação real (ver os specs
  // correspondentes) — não há mais páginas em placeholder no menu. O Bot virou
  // o Assistente Amare (ver assistente.cy.js).

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
    cy.intercept('GET', '**/api/equipe-medica/', { body: [] })
    cy.intercept('GET', '**/api/eventos/', { body: [] })
    cy.intercept('GET', '**/api/jornada/', { body: [] })
    cy.intercept('GET', '**/api/apoio/**', { body: [] })
    cy.intercept('GET', '**/api/sintomas/', { body: [] })
    cy.intercept('GET', '**/api/ciclo/**', { body: [] })
    cy.intercept('GET', '**/api/busca/**', { body: [] })
    cy.intercept('GET', '**/api/privacidade/**', { body: [] })
    cy.intercept('GET', '**/api/assistente/**', {
      body: { disclaimer: 'Informações gerais da Amare.', sugestoes: [] },
    })
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
    cy.get('[data-cy=home-saudacao]').should('contain', 'Bem-vinda, Júlia')
    cy.get('[data-cy=app-sidebar]').should('be.visible')
    cy.get('[data-cy=app-header]').should('be.visible')
    cy.get('[data-cy=app-search]').should('be.visible')
    cy.get('[data-cy=app-search] input').should(
      'have.attr',
      'placeholder',
      'Buscar na Amare',
    )

    // Shell do design system (PR3): rodapé, skip-link e landmark do conteúdo.
    cy.get('[data-cy=rodape]').should('exist')
    cy.get('.skip-link').should('have.attr', 'href', '#conteudo-principal')
    cy.get('#conteudo-principal').should('exist')
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
    cy.get('[data-cy=home-saudacao]').should('contain', 'Bem-vinda, Júlia')

    cy.get('[data-cy=nav-bot]').should('have.attr', 'href', '/bot')
    cy.get('[data-cy=nav-bot]').click()
    cy.location('pathname').should('eq', '/bot')
    cy.contains('h1', 'Assistente Amare').should('be.visible')

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

    cy.get('[data-cy=nav-equipe-medica]').should(
      'have.attr',
      'href',
      '/equipe-medica',
    )
    cy.get('[data-cy=nav-equipe-medica]').click()
    cy.location('pathname').should('eq', '/equipe-medica')
    cy.contains('h1', 'Equipe médica').should('be.visible')

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

    cy.get('[data-cy=nav-sintomas]').should('have.attr', 'href', '/sintomas')
    cy.get('[data-cy=nav-sintomas]').click()
    cy.location('pathname').should('eq', '/sintomas')
    cy.contains('h1', 'Sintomas e observações').should('be.visible')

    cy.get('[data-cy=nav-ciclo]').should('have.attr', 'href', '/ciclo')
    cy.get('[data-cy=nav-ciclo]').click()
    cy.location('pathname').should('eq', '/ciclo')
    cy.contains('h1', 'Meu ciclo').should('be.visible')
  })

  it('abre o Assistente Amare corretamente por rota direta', () => {
    visitarAutenticado('/bot')
    cy.get('[data-cy=app-layout]').should('be.visible')
    cy.get('[data-cy=app-search]').should('be.visible')
    cy.get('[data-cy=page-bot]').should('be.visible')
    cy.contains('h1', 'Assistente Amare').should('be.visible')
    cy.get('[data-cy=bot-disclaimer]').should('be.visible')
  })
})
