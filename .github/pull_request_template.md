## O que muda

<!-- Descreva em poucas linhas o que esta PR faz e por quê. -->

## Como testar

<!-- Passos para validar. Ex.: rotas, comandos, telas afetadas. -->

## Checklist geral

- [ ] `npm run lint` e `npm run build` passam (frontend).
- [ ] `npm run cypress:run` verde (ou justificativa se não se aplica).
- [ ] `python manage.py check` e os testes do backend passam.
- [ ] Sem `console.log`/`print` de dados pessoais deixados no código.
- [ ] Textos visíveis em pt-BR; arquivos em UTF-8.

## Checklist LGPD (obrigatório quando mexe em dados de usuário)

> Vale para qualquer PR que toque usuário, perfil, paciente, médica, consulta,
> medicamento ou outro dado pessoal. Detalhes em `docs/lgpd/`.

- [ ] **Minimização**: não adicionei dado pessoal desnecessário.
- [ ] **Sem dado sensível em URL**: busca por ID, não por nome/telefone/dado clínico.
- [ ] **Sem dado pessoal em log**: nada de `console.log`/`print` de formulário, perfil ou resposta da API.
- [ ] **Permissão no backend**: o endpoint valida o papel e o dono do dado (não confio só no frontend).
- [ ] **Serializer mínimo**: a resposta expõe apenas os campos que a tela usa.
- [ ] **Acesso negado testado**: há teste cobrindo quem NÃO pode acessar.
- [ ] **Dados fictícios**: seeds/fixtures/testes não usam dado real de paciente.
- [ ] **Mapeamento atualizado**: se criei campo de dado pessoal, atualizei `docs/lgpd/mapeamento-dados.md`.
