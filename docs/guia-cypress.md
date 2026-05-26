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

## Inventário de specs

A suíte atual tem **66 testes verdes** distribuídos em 7 specs:

| Spec | Testes | Cobre |
|---|---|---|
| `login.cy.js` | 10 | Tela de login (PROJ login) |
| `perfil.cy.js` | 9 | Perfil da paciente |
| `dicionario.cy.js` | 9 | Lista, busca e detalhes (PROJ-3, PROJ-4) |
| `consultas.cy.js` | 11 | Calendário e banner (PROJ-1) |
| `layout-rotas.cy.js` | 6 | Rotas e estrutura do AppLayout |
| `responsividade-mobile.cy.js` | 11 | Drawer mobile e breakpoints |
| `polimento-ux-perfil.cy.js` | 10 | `SelectField`, máscara de telefone, transição |
| **Total** | **66** | |

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

## O que os testes de Consultas verificam

`frontend/cypress/e2e/consultas.cy.js` cobre 11 cenários da página
`/calendario` e do banner da Home (PROJ-1):

1. A página `/calendario` exibe título e cabeçalho.
2. Calendário do mês e painel lateral aparecem quando há consultas.
3. O calendário abre no mês da próxima consulta agendada.
4. Os dias com consulta agendada ganham marcador na grade (cenário BDD).
5. Painel lateral lista as próximas consultas.
6. Painel lateral lista os lembretes derivados das consultas.
7. Clicar num dia marcado destaca o dia e mostra o detalhe.
8. Banner da Home mostra a próxima consulta quando há agendamento (cenário BDD).
9. Banner some quando não há próximas consultas (cenário BDD).
10. Status `realizada` e `cancelada` aparecem com seus rótulos corretos.
11. Navegação entre meses (botões anterior/próximo) muda o título do mês.

### Padrão de mocks com data fixa

Como o calendário depende da data atual, os testes fixam o relógio do
navegador em **25 de maio de 2026** com `cy.clock`:

```js
function fixarDataAtual() {
  const inicio = new Date('2026-05-25T12:00:00Z').getTime()
  cy.clock(inicio, ['Date'])
}

beforeEach(() => {
  cy.clearLocalStorage()
  fixarDataAtual()
})
```

Sem isso, a grade renderiza o mês corrente e os mocks (que usam datas
absolutas em maio/2026) deixam de bater. O `['Date']` no segundo argumento
restringe o mock ao `Date` global e não congela `setTimeout`/`setInterval`
— evita travar animações da Motion.

### Mockando os dois endpoints

A página chama `/api/consultas/` (lista completa) e a Home chama
`/api/consultas/proximas/`. Sempre mocke os dois quando o teste tocar nas
duas rotas:

```js
cy.intercept('GET', '**/api/consultas/', { body: consultasMock }).as('listar')
cy.intercept('GET', '**/api/consultas/proximas/', { body: proximasMock }).as('proximas')
```

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

## Testes de viewport mobile

`frontend/cypress/e2e/responsividade-mobile.cy.js` valida o comportamento
mobile (drawer, tap targets, ausência de scroll horizontal) usando
`cy.viewport()`. A suíte original (`login`, `perfil`, `dicionario`,
`layout-rotas`) continua em 1280x720 — não foi necessário adaptá-la.

### Viewports usados

```js
const VIEWPORT_IPHONE_12 = { largura: 390, altura: 844 }
const VIEWPORT_PIXEL_7  = { largura: 412, altura: 915 }
const VIEWPORT_IPAD_MINI = { largura: 768, altura: 1024 }
```

iPad Mini (768px) é o ponto de virada — testar nele garante que a sidebar
desktop volta a aparecer assim que a viewport cresce além do drawer.

### Helper de visita autenticada em mobile

```js
function visitarAutenticadoMobile(rota, viewport = VIEWPORT_IPHONE_12) {
  cy.viewport(viewport.largura, viewport.altura)
  cy.intercept('GET', '**/api/perfil/', { body: PERFIL_MOCK }).as('perfil')
  cy.intercept('GET', '**/api/dicionario/termos/**', { body: TERMOS_MOCK })
    .as('termos')
  return cy.visit(rota, {
    onBeforeLoad(janela) {
      janela.localStorage.setItem('marea_auth', JSON.stringify(SESSAO_FAKE))
    },
  })
}
```

### Detectando scroll horizontal

```js
function semScrollHorizontal() {
  cy.window().then((janela) => {
    const documento = janela.document.documentElement
    expect(documento.scrollWidth).to.be.lte(janela.innerWidth)
  })
}
```

### Cuidados

- O drawer (`[data-cy=app-layout-drawer]`) só existe no DOM enquanto está
  aberto. Use `should('not.exist')` para confirmar que fechou.
- A sidebar desktop (`[data-cy=app-sidebar]`) **sempre** existe no DOM,
  mas o CSS a esconde abaixo de 768px. Use `should('not.be.visible')` em
  vez de `should('not.exist')`.
- Com o drawer aberto, dois `[data-cy=nav-dicionario]` coexistem (sidebar
  hidden + drawer visível). Filtre pelo container do drawer:
  `cy.get('[data-cy=app-layout-drawer] [data-cy=nav-dicionario]')`.
- O backdrop tem animação de entrada/saída. Para clicar imediatamente
  após abrir, use `{ force: true }` ou aguarde a animação.

## Testes de componentes customizados e máscaras

`frontend/cypress/e2e/polimento-ux-perfil.cy.js` cobre os componentes
customizados desta iteração: transição de rota, `SelectField` e máscara
de telefone.

### Testando o `SelectField`

Como o `SelectField` é um combobox customizado, o teste interage com o
`<button>` raiz e com a `<ul role="listbox">`:

```js
// Abrir a lista
cy.get('[data-cy=perfil-tipo-sanguineo]').click()
cy.get('[role=listbox]').should('be.visible')

// Selecionar uma opção
cy.get('[data-cy=perfil-tipo-sanguineo-opcao-AB-]').click()
cy.get('[role=listbox]').should('not.exist')

// Confirmar o valor selecionado (não use have.value — é um <button>)
cy.get('[data-cy=perfil-tipo-sanguineo]').should('contain', 'AB-')
```

Padrão de `data-cy` das opções: `{dataCy do botão}-opcao-{valor}`.
Ex.: `perfil-tipo-sanguineo-opcao-O+`.

### Fechar via Esc ou click fora

```js
// Esc — disparado no próprio botão (que tem foco)
cy.get('[data-cy=perfil-tipo-sanguineo]').type('{esc}')

// Click fora — qualquer elemento fora do .select-field
cy.get('h1').contains('Perfil').click()
```

### Teclado: setas + Enter

O `keydown` é tratado no `<button>` raiz, não na `<ul>`. Use `force:
true` se o botão sair de foco entre `.type()` consecutivos:

```js
cy.get('[data-cy=perfil-tipo-sanguineo]').click()
cy.get('[data-cy=perfil-tipo-sanguineo]')
  .type('{downarrow}', { force: true })
  .type('{enter}', { force: true })
cy.get('[data-cy=perfil-tipo-sanguineo]').should('contain', 'O-')
```

### Testando a máscara de telefone

Quando `formatarTelefone` é aplicado no `onChange`, basta digitar uma
mistura de letras e dígitos: o input final é sempre formatado.

```js
// Letras viram string vazia
cy.get('[data-cy=perfil-telefone]').clear().type('abc')
cy.get('[data-cy=perfil-telefone]').should('have.value', '')

// 11 dígitos seguidos viram (XX) XXXXX-XXXX
cy.get('[data-cy=perfil-telefone]').clear().type('81999998888')
cy.get('[data-cy=perfil-telefone]').should('have.value', '(81) 99999-8888')

// Digitação além de 11 dígitos é ignorada
cy.get('[data-cy=perfil-telefone]').clear().type('819999988880000')
cy.get('[data-cy=perfil-telefone]').should('have.value', '(81) 99999-8888')
```

Você pode digitar com separadores (`(81) 99999-8888`) — `formatarTelefone`
extrai só os dígitos e reformata. O resultado final é sempre canônico.

### Testes de transição de rota

`PageTransition` usa `AnimatePresence mode="wait"` (até ~200 ms).
Cypress espera elementos aparecerem por padrão, então a transição não
exige `cy.wait` explícito — basta interagir com o seletor da página
nova:

```js
cy.get('[data-cy=nav-dicionario]').click()
cy.location('pathname').should('eq', '/dicionario')
cy.get('[data-cy=page-perfil]').should('not.exist')
```
