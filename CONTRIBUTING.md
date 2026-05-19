# Como contribuir

Guia rápido para contribuir com o projeto Maréa.

## Não trabalhe direto na main

A branch `main` é protegida pelo time. Toda alteração é feita em uma branch própria e
integrada por pull request.

## Padrão de branches

Use nomes curtos, em português, sem espaços e sem acentos:

- `configuracao-inicial`
- `documentacao-ambiente`
- `documentacao-ferramentas`
- `pagina-login`
- `validacao-login`
- `ajustes-visuais-login`
- `testes-login`
- `ajustes-documentacao`

Criar uma branch:

```
git checkout -b pagina-login
```

## Padrão de commits

Mensagem em português, com prefixo que indica o tipo da mudança:

- `chore:` configuração e infraestrutura
- `docs:` documentação
- `feat:` nova funcionalidade
- `test:` testes
- `style:` ajustes visuais e de formatação

Exemplos:

```
chore: configurar estrutura inicial do projeto
docs: adicionar guia de Cypress
feat: criar página de login
feat: adicionar validação do formulário de login
test: adicionar testes da tela de login
style: ajustar identidade visual da tela de login
docs: atualizar documentação principal
```

## Testar antes de enviar

Antes de abrir um pull request:

- Frontend: `npm run lint` sem erros e `npm run cypress:run` com todos os testes passando.
- Backend: `python manage.py migrate` e `python manage.py runserver` sem erros.

Não envie alterações que quebrem o lint ou os testes.

## Manter o código organizado

- Rode `npm run format` antes de commitar.
- Use nomes claros para componentes, funções, classes CSS, arquivos e pastas.
- Evite comentários desnecessários.
- Mantenha os arquivos em UTF-8 e os textos visíveis em português.

## Como abrir um pull request

1. Suba a branch:

```
git push -u origin pagina-login
```

2. No GitHub, clique em "Compare & pull request".
3. Descreva o que foi feito e abra o PR para a `main`.
4. Aguarde a revisão antes do merge.
