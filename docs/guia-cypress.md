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
