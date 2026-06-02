# Checklist de LGPD para revisão de PR

Lista de apoio para abrir ou revisar uma PR. Use o bloco de LGPD sempre que a
mudança tocar dados de usuário (usuário, perfil, paciente, médica, consulta,
medicamento ou qualquer outro dado pessoal).

> É um guia opcional — não força nada no fluxo de PR do repositório.

## Geral

- [ ] `npm run lint` e `npm run build` passam (frontend).
- [ ] `npm run cypress:run` verde (ou justificativa, se não se aplica).
- [ ] `python manage.py check` e os testes do backend passam.
- [ ] Sem `console.log`/`print` de dados pessoais deixados no código.
- [ ] Textos visíveis em pt-BR; arquivos em UTF-8.

## LGPD (quando mexe em dados de usuário)

- [ ] **Minimização**: não adicionei dado pessoal desnecessário.
- [ ] **Sem dado sensível em URL**: busca por ID, não por nome/telefone/dado clínico.
- [ ] **Sem dado pessoal em log**: nada de `console.log`/`print` de formulário, perfil ou resposta da API.
- [ ] **Permissão no backend**: o endpoint valida o papel e o dono do dado (não confio só no frontend).
- [ ] **Serializer mínimo**: a resposta expõe apenas os campos que a tela usa.
- [ ] **Acesso negado testado**: há teste cobrindo quem NÃO pode acessar.
- [ ] **Dados fictícios**: seeds/fixtures/testes não usam dado real de paciente.
- [ ] **Mapeamento atualizado**: se criei campo de dado pessoal, atualizei [`mapeamento-dados.md`](mapeamento-dados.md).
