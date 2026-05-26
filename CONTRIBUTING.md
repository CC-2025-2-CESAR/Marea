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

Antes de abrir um pull request, dentro de `frontend/`:

```
npm run lint
npm run build
npm run cypress:run
```

- `npm run lint` deve sair sem erros nem warnings.
- `npm run build` deve gerar o bundle sem falhas.
- `npm run cypress:run` deve sair com todos os 66 testes verdes (ajustar o
  número conforme novas suítes entram).

E no `backend/` (venv ativo):

```
python manage.py migrate
python manage.py runserver
```

Devem subir sem erros. Se a feature toca o backend, rode também
`python manage.py loaddata <fixture>` quando aplicável e
`python manage.py criar_usuarios_teste` para garantir os usuários
fictícios.

Não envie alterações que quebrem o lint, o build ou os testes.

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
