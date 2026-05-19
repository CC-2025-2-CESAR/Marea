# Guia do ESLint e Prettier

Como manter o código padronizado no frontend.

## Para que serve o ESLint

O ESLint analisa o código e aponta erros e más práticas (variável não usada, import
errado, etc.). Ele cuida da qualidade do código.

## Para que serve o Prettier

O Prettier formata o código automaticamente (espaçamento, aspas, quebra de linha). Ele
cuida da aparência do código.

## Diferença entre ESLint e Prettier

- ESLint: encontra problemas de lógica e padrão.
- Prettier: deixa o estilo do código uniforme.

Eles trabalham juntos: o Prettier formata, o ESLint verifica.

## Como rodar a verificação de lint

Dentro da pasta `frontend`:

```
npm run lint
```

## Como formatar o código

```
npm run format
```

## Configurar o VS Code para formatar ao salvar

Abra as configurações (JSON) e adicione:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode"
}
```

## Extensões recomendadas do VS Code

- Prettier - Code formatter (`esbenp.prettier-vscode`)
- ESLint (`dbaeumer.vscode-eslint`)

## O que fazer quando aparecer erro de lint

1. Leia a mensagem: ela indica o arquivo e a linha.
2. Rode `npm run format` para corrigir problemas de formatação.
3. Corrija manualmente o que o ESLint apontar (ex.: remover variável não usada).
4. Rode `npm run lint` de novo até não haver erros.
