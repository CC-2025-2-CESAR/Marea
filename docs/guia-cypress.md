# Guia do Cypress

Como usar o Cypress no projeto Maréa.

## Para que serve o Cypress

O Cypress roda testes de ponta a ponta (E2E): ele abre a aplicação no navegador e simula
o uso real, garantindo que a tela funciona como esperado.

## Onde ficam os testes

Os testes ficam em:

```
frontend/cypress/e2e/
```

O teste da tela de login é `frontend/cypress/e2e/login.cy.js`.

## Como abrir o Cypress

Com o frontend rodando (`npm run dev`), em outro terminal dentro de `frontend`:

```
npm run cypress:open
```

## Como rodar os testes pelo terminal

```
npm run cypress:run
```

## O que os testes da tela de login verificam

1. A página de login carrega.
2. O logo aparece.
3. O campo de usuário/e-mail aparece.
4. O campo de senha aparece.
5. O botão de login aparece.
6. Login com campos vazios mostra mensagem de erro.
7. O ícone de mostrar/ocultar senha troca o tipo do campo.
8. Preencher e enviar mostra a mensagem de sucesso simulada.

## Como criar um teste simples

```js
describe('Tela de login', () => {
  it('mostra o botão de login', () => {
    // Verificar se a página carregou
    cy.visit('/')

    // Verificar se um botão aparece
    cy.get('[data-cy=login-submit]').should('be.visible')

    // Digitar em um campo
    cy.get('[data-cy=login-username]').type('paciente@exemplo.com')

    // Clicar em um botão
    cy.get('[data-cy=login-submit]').click()

    // Verificar se uma mensagem apareceu
    cy.get('[data-cy=login-feedback]').should('be.visible')
  })
})
```

## O que os testes do Dicionário verificam

`frontend/cypress/e2e/dicionario.cy.js` cobre oito cenários da página de termos
médicos (PROJ-3 e PROJ-4):

1. A página carrega com o título "Dicionário".
2. A lista de termos aparece quando a API retorna dados.
3. Lista vazia exibe "Nenhum termo encontrado."
4. O painel de detalhes orienta a seleção quando nenhum termo está aberto.
5. Buscar por um termo filtra a lista.
6. Buscar por um termo inexistente exibe a mensagem vazia.
7. Clicar em um termo abre o painel de detalhes.
8. Erro da API exibe `dicionario-mensagem-erro`.

## Mockando a API com `cy.intercept`

Os testes do dicionário não dependem do backend rodando. Usam `cy.intercept` para
responder às requisições HTTP com dados fixos:

```js
cy.intercept('GET', '**/api/dicionario/termos/**', { body: termosMock }).as('listar')
cy.visit('/dicionario')
cy.wait('@listar')
```

Para simular erro:

```js
cy.intercept('GET', '**/api/dicionario/termos/**', { statusCode: 500, body: {} })
```

Use `cy.wait('@alias')` antes de fazer asserções que dependem dos dados da resposta —
isso evita flakiness por timing.

## Testando rotas protegidas e fluxo JWT

A partir da etapa de autenticação, todas as rotas internas (`/`, `/perfil`,
`/dicionario` etc.) vivem dentro de `<ProtectedRoute>`. Sem sessão no
`localStorage`, qualquer `cy.visit` para essas rotas redireciona para
`/login` — e o teste falha.

Padrão usado no projeto: setar a sessão fake via `onBeforeLoad` no `cy.visit`:

```js
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
```

Cada `*.cy.js` que toca rotas internas tem o seu próprio helper inline —
mais simples que comandos globais. Antes do `visit`, sempre chame
`cy.clearLocalStorage()` no `beforeEach` para isolar os testes entre si.

Para testar o fluxo real de login (sem hardcode da sessão), mocke
`POST /api/auth/login/` e use o componente normalmente:

```js
cy.intercept('POST', '**/api/auth/login/', {
  statusCode: 200,
  body: {
    access: 'token-de-acesso-fake',
    refresh: 'token-de-refresh-fake',
    usuario: { id: 1, username: 'paciente_teste', ... },
  },
}).as('login')

cy.visit('/login')
cy.get('[data-cy=login-username]').type('paciente_teste')
cy.get('[data-cy=login-password]').type('amare123')
cy.get('[data-cy=login-submit]').click()
cy.wait('@login')
cy.location('pathname').should('eq', '/perfil')
```

Para validar erro:

```js
cy.intercept('POST', '**/api/auth/login/', {
  statusCode: 401,
  body: { detail: 'Usuário ou senha inválidos.' },
}).as('login')
```

Ou simular indisponibilidade de rede:

```js
cy.intercept('POST', '**/api/auth/login/', { forceNetworkError: true })
```

O teste do botão Sair lê `localStorage` direto:

```js
cy.get('[data-cy=nav-logout]').click()
cy.location('pathname').should('eq', '/login')
cy.window().its('localStorage.marea_auth').should('be.undefined')
```
