# Heurísticas de Nielsen — Amare

Checklist das 10 heurísticas de usabilidade de Jakob Nielsen aplicadas à Amare,
cada uma com **evidência no código** e as lacunas honestas. Complementa o
relatório de [acessibilidade](acessibilidade.md): aqui o foco é usabilidade
geral, lá é tecnologia assistiva e conformidade WCAG.

## Resumo

| # | Heurística | Status |
|---|------------|--------|
| 1 | Visibilidade do status do sistema | ✅ |
| 2 | Correspondência entre o sistema e o mundo real | ✅ |
| 3 | Controle e liberdade do usuário | ✅ |
| 4 | Consistência e padrões | ✅ |
| 5 | Prevenção de erros | ✅ |
| 6 | Reconhecimento em vez de memorização | ✅ |
| 7 | Flexibilidade e eficiência de uso | ✅ |
| 8 | Estética e design minimalista | ✅ |
| 9 | Ajudar a reconhecer, diagnosticar e recuperar de erros | ✅ |
| 10 | Ajuda e documentação | ✅ |

---

## 1. Visibilidade do status do sistema

O sistema sempre diz o que está acontecendo.

- **Feedback de ação**: `Toast` (`components/ui/Toast/ToastProvider.tsx`) confirma
  salvar/erro em Perfil, Sintomas, Ciclo, Meus dados, gestão e área da médica.
- **Carregando**: `Skeleton` (`aria-busy`) e estados "carregando…" nas telas que
  dependem de API; `PageTransition` dá retorno visual ao trocar de rota.
- **Progresso concreto**: contador "X de Y tomados hoje" no checklist de
  medicamentos; atualização **otimista** (a interface responde antes do servidor)
  com reversão se o PATCH falhar.
- **Estado dos itens**: `StatusBadge` mostra o tom certo para fase do ciclo,
  status da solicitação de privacidade (pendente/concluída/recusada) e a
  permissão da médica (responsável/visualização/assumido).

## 2. Correspondência entre o sistema e o mundo real

A linguagem é a da paciente, não a do banco de dados.

- Texto pt-BR simples e acolhedor; sem jargão técnico de código na interface.
- O **dicionário** existe justamente para traduzir os termos médicos; tratamentos
  e orientações ligam-se a ele por chips ("artigos relacionados").
- Rótulos do dia a dia: "Próxima menstruação", "Período fértil", "Tomado hoje",
  "Próxima consulta"; datas formatadas em pt-BR.

## 3. Controle e liberdade do usuário

Saídas de emergência claras em todo lugar.

- **Voltar** e breadcrumb nas telas de detalhe (dicionário, tratamentos,
  orientações, especialidades).
- Fechar `Drawer`/`Modal` pelo × **e** por `Escape`; clicar no fundo fecha.
- **Cancelar** sempre presente no `ConfirmDialog`.
- A paciente **edita e exclui** os próprios registros (ciclo, sintomas).
- **Sair** sempre disponível na Sidebar, limpando a sessão.

## 4. Consistência e padrões

Um jeito só de fazer cada coisa.

- **Design system** compartilhado: `Button`, `InputField`, `SelectField`,
  `StatusBadge`, `Modal`, `Drawer`, `Toast`, `EmptyState`, `Skeleton`,
  `Tabs`, `InteractiveCard`.
- **Tokens** centralizados em `frontend/src/styles/variables.css` (cores
  `--cor-*`, espaços `--espaco-*`, raios, sombras) — nada de valor mágico solto.
- Telas de detalhe seguem o mesmo molde (`useParams` + voltar + relacionados +
  estado vazio); `data-cy` segue a mesma convenção em toda parte.

## 5. Prevenção de erros

Evitar o erro é melhor que avisar depois.

- **Confirmação antes de destruir**: `ConfirmDialog` antes de excluir registro de
  ciclo/sintoma e antes de excluir termo na gestão; "assumir atendimento" exige
  **motivo** (e observação quando "outro").
- **Validação de formulário**: mensagem obrigatória na solicitação de
  privacidade; senha confirmada na ativação/redefinição; campos com `type` certo
  (email/tel/date/password).
- **A barreira real é o backend**: escopo de dono e permissões por papel impedem
  a ação no servidor — a interface só esconde o que o backend já nega, então um
  clique indevido não vira dado errado.

## 6. Reconhecimento em vez de memorização

O caminho está à vista; a paciente não precisa decorar nada.

- Navegação sempre visível na `Sidebar`, **filtrada por papel** (paciente/médica/
  admin veem só o que lhes cabe).
- **Busca global** no cabeçalho com resultados agrupados por tipo.
- `EmptyState` explica o vazio **e oferece a ação** ("nenhum registro ainda" +
  botão para criar).
- Chips de perguntas no assistente e chips de termos relacionados com deep-link
  sugerem o próximo passo em vez de exigir que a pessoa o invente.

## 7. Flexibilidade e eficiência de uso

Atalhos para quem já sabe, sem atrapalhar quem está começando.

- **Busca global**: chega a qualquer conteúdo sem saber em que página ele está.
- **Deep-links**: a busca e os chips abrem o dicionário **já filtrado**
  (`/dicionario?busca=<termo>`).
- **Skip-link** acelera a navegação por teclado.
- **Baixar JSON** dos próprios dados em "Meus dados" resolve a portabilidade num
  clique.

## 8. Estética e design minimalista

Só o essencial na tela.

- Layout limpo, **uma coluna no mobile**, hierarquia clara de títulos.
- Espaçamento e ritmo vindos dos tokens; sem poluição visual competindo com o
  conteúdo sensível.

## 9. Ajudar a reconhecer, diagnosticar e recuperar de erros

Mensagens específicas, em linguagem humana — nunca "algo deu errado".

- O cliente HTTP `requisicao<T>` (`frontend/src/services/api.ts`) expõe o corpo
  `.detalhe` do backend, e as telas mostram **esse texto** (ex.: a gestão do
  dicionário exibe o motivo exato da recusa).
- **401** devolve a pessoa ao login; **403/404** nas telas de detalhe viram
  `EmptyState`/aviso, sem vazar dados de terceiros.
- **Reversão**: o checklist de medicamentos desfaz a marcação otimista quando o
  PATCH falha, e avisa.

## 10. Ajuda e documentação

Ajuda no contexto, quando importa.

- **Disclaimers fixos** onde a segurança pede: "Estimativa baseada nos seus
  registros. Não substitui a orientação da equipe médica." (ciclo); "não
  substitui acompanhamento profissional" (apoio emocional); o **Assistente
  Amare** encaminha tema sensível para a clínica, com contatos, e nunca
  diagnostica nem altera dose.
- **Privacidade na interface**: página pública de Privacidade + área "Meus dados"
  (ver/baixar/solicitar correção ou exclusão) — ver [docs/lgpd](lgpd/README.md).
- O próprio **dicionário/orientações** funcionam como ajuda contextual sobre o
  tratamento.

---

## Lacunas e evoluções possíveis

- **Desfazer (undo)**: hoje a estratégia para ação destrutiva é **confirmar
  antes** (`ConfirmDialog`), não desfazer depois. Um "desfazer" em toast logo
  após a exclusão seria uma evolução de conforto — não implementado.
- **Mensagens de erro**: já são específicas onde o backend manda `.detalhe`;
  vale auditar telas mais antigas para garantir que nenhuma caiu em texto
  genérico.
- A verificação de usabilidade com **usuárias reais** (roteiro + evidências) é a
  frente complementar do fechamento e depende de material de campo.
