# Fluxo de Git

Como trabalhar com Git no projeto Maréa.

## Regra principal

Não trabalhe direto na `main`. Toda alteração é feita em uma branch própria.

## Como criar uma branch

```
git checkout -b pagina-login
```

## Como trocar de branch

```
git checkout main
```

## Como ver as branches

```
git branch
```

## Como fazer commit

```
git add .
git commit -m "feat: criar página de login"
```

## Como enviar a branch para o GitHub

```
git push -u origin pagina-login
```

## Como abrir um pull request

1. Acesse o repositório no GitHub.
2. Clique em "Compare & pull request".
3. Descreva o que foi feito e abra o PR para a `main`.

## Como atualizar a branch com a main

```
git checkout main
git pull
git checkout pagina-login
git merge main
```

## Como resolver conflitos básicos

1. O Git marca o conflito no arquivo entre `<<<<<<<` e `>>>>>>>`.
2. Edite o arquivo deixando apenas o conteúdo correto.
3. Finalize:

```
git add .
git commit
```

## Como nomear branches

Use nomes curtos, em português, sem espaços:

- `configuracao-inicial`
- `documentacao-ambiente`
- `documentacao-ferramentas`
- `pagina-login`
- `validacao-login`
- `testes-login`
- `ajustes-documentacao`

## Como escrever commits

Use um prefixo que indique o tipo da mudança:

- `chore:` configuração e tarefas de infraestrutura
- `docs:` documentação
- `feat:` nova funcionalidade
- `test:` testes
- `style:` ajustes visuais e de formatação

Exemplos:

```
chore: configurar estrutura inicial do projeto
docs: adicionar guia de Cypress
feat: criar página de login
test: adicionar testes da tela de login
style: ajustar identidade visual da tela de login
```
