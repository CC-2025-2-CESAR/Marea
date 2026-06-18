# Acessibilidade — Amare

A Amare acompanha pacientes em tratamento de fertilidade, muitas vezes em
momentos de fragilidade emocional e usando o celular. Acessibilidade aqui não é
acabamento: é parte do cuidado. Este documento é o **relatório de acessibilidade**
do projeto — o que já está implementado (com evidência no código) e o roteiro de
verificação manual que deve rodar a cada entrega relevante.

- **Alvo de conformidade**: WCAG 2.1 nível AA + o checklist de acessibilidade do
  plano do programa (foco visível, `aria-current`, `aria-live`, foco preso em
  diálogos, `prefers-reduced-motion`, alvos ≥44px, contraste).
- **Princípio**: os comportamentos de acessibilidade moram em **componentes
  compartilhados** (shell, `Modal`, `Drawer`, `Toast`, `Button`, `InputField`,
  `SelectField`). Garantir a acessibilidade no primitivo cobre todas as telas que
  o consomem, em vez de remendar tela a tela.

## Como verificamos

Acessibilidade tem uma parte que dá para checar de forma automática (no código e
na CI) e uma parte que exige olho humano no navegador. As duas contam.

### Automático (roda na CI a cada PR)

- **Lint + build** (`npm run lint`, `npm run build` com `tsc --noEmit`): garante
  marcação válida e o uso correto dos componentes tipados.
- **Cypress** — inclui a suíte dedicada `cypress/e2e/responsividade-mobile.cy.js`
  em viewports reais (iPhone 12 `390×844`, Pixel 7 `412×915`, iPad Mini
  `768×1024`) e cenários mobile específicos em `ciclo`, `sintomas`,
  `medicamentos`, `ativacao`, `recuperacao` e `assistente` (`375×667`/`375×700`).

### Manual no navegador (rodar a cada release)

Roteiro mínimo, a registrar na tabela abaixo:

1. **WAVE** (extensão) na home, no dicionário, no calendário, em "Meus dados" e
   no login — zero erros é a meta.
2. **Lighthouse** (aba *Accessibility*, modo mobile) nas mesmas telas — registrar
   a nota.
3. **Teclado**: percorrer a tela só com `Tab`/`Shift+Tab`; abrir um diálogo
   (assumir atendimento, confirmar exclusão), conferir que o foco fica **preso**
   dentro dele, que `Escape` fecha e que o foco **volta** para o gatilho.
4. **Leitor de tela** (NVDA no Windows / VoiceOver no macOS): conferir se toasts e
   mensagens de erro são anunciados e se os campos têm rótulo.
5. **Zoom 200%** e **`prefers-reduced-motion`** ligado no SO: sem rolagem
   horizontal, sem animação que atrapalhe.

#### Registro das verificações manuais

| Data | Versão / commit | Tela | WAVE (erros) | Lighthouse a11y | Teclado | Leitor de tela | Observações |
|------|-----------------|------|--------------|-----------------|---------|----------------|-------------|
| _a preencher_ | | | | | | | |

> Esta tabela é preenchida por quem roda a verificação manual no navegador. Os
> itens da seção seguinte já estão garantidos no código.

## O que já está implementado (com evidência)

| # | Critério | Status | Onde está no código |
|---|----------|--------|---------------------|
| 1 | **Pular para o conteúdo** (bypass de blocos) | ✅ | `frontend/src/layouts/AppLayout/AppLayout.jsx` — `<a class="skip-link" href="#conteudo-principal">`; alvo é o `<main id="conteudo-principal">`. Estilo em `frontend/src/styles/a11y.css` (`.skip-link`, fora da tela até receber foco). |
| 2 | **Foco visível** consistente | ✅ | `frontend/src/styles/a11y.css` — `:focus-visible` em `a/button/input/select/textarea/[tabindex]` com contorno de 2px e `outline-offset`. |
| 3 | **Foco preso em diálogo** + `Escape` + devolução de foco | ✅ | `frontend/src/components/ui/Modal/Modal.tsx` — `role="dialog"`, `aria-modal="true"`, `aria-labelledby`/`aria-describedby`, ciclo de `Tab`/`Shift+Tab`, `Escape` fecha, foco entra ao abrir e **volta ao gatilho** ao fechar, scroll do corpo travado. O drawer de navegação repete o padrão em `AppLayout.jsx` (`role="dialog"`, `aria-modal`, `aria-label="Menu de navegação"`, `Escape`, trava de scroll). |
| 4 | **Mensagens de status / regiões dinâmicas** | ✅ | `frontend/src/components/ui/Toast/ToastProvider.tsx` — região `role="region"` `aria-label="Notificações"`, cada toast com `role="status"` (anúncio educado). `aria-busy` nos esqueletos (`frontend/src/components/ui/Skeleton/Skeleton.tsx`). `role="alert"`/`aria-live` em erros e avisos espalhados (43 ocorrências em 31 arquivos de `frontend/src`). |
| 5 | **Estado atual da navegação** (`aria-current`) | ✅ | itens de navegação (`NavLink`) e a `TreatmentTimeline` (`frontend/src/components/TreatmentTimeline/TreatmentTimeline.tsx`) marcam o item atual. |
| 6 | **Respeito a `prefers-reduced-motion`** | ✅ | global via `<MotionConfig reducedMotion="user">` em `frontend/src/App.jsx`; reforço em CSS no `frontend/src/styles/a11y.css` (`@media (prefers-reduced-motion: reduce)` zera durações); componentes animados usam `useReducedMotion` (ex.: `Modal`, `Toast`). |
| 7 | **Alvos de toque ≥44px e fontes de formulário 16px** | ✅ | `Button` com `min-height: 44px`, `InputField` com fonte 16px (evita zoom no iOS), `.skip-link` com `min-height: 44px`. Checklist mobile aplicado a cada PR. |
| 8 | **Landmarks semânticos** | ✅ | `AppLayout` estrutura `header` (Header), `nav` (Sidebar), `main#conteudo-principal` e `footer` (Footer); telas usam `<h1>` único + hierarquia de títulos. |
| 9 | **Conteúdo para leitor de tela e rótulos** | ✅ | utilitário `.sr-only` em `a11y.css`; botões de ícone com `aria-label` (fechar modal, fechar toast, abrir menu). |
| 10 | **Cobertura mobile automatizada** | ✅ | `cypress/e2e/responsividade-mobile.cy.js` + cenários mobile nas features-chave (ver "Como verificamos"). |

## Mapeamento resumido com a WCAG 2.1 AA

| Critério WCAG | Como a Amare atende |
|---------------|---------------------|
| 1.3.1 Informação e relações | marcação semântica (landmarks, títulos, listas, `label` ligado a campo). |
| 2.1.1 Teclado / 2.1.2 Sem armadilha | tudo operável por teclado; o foco preso do `Modal`/drawer **libera** com `Escape`. |
| 2.4.1 Ignorar blocos | skip-link para `#conteudo-principal`. |
| 2.4.3 Ordem de foco / 2.4.7 Foco visível | ordem natural do DOM; `:focus-visible` global. |
| 2.3.3 Animação por interação | `prefers-reduced-motion` respeitado global e por componente. |
| 3.3.1 Identificação de erro / 3.3.2 Rótulos | mensagens de erro específicas (não genéricas) e campos rotulados; ver [heuristicas-nielsen.md](heuristicas-nielsen.md), heurística 9. |
| 4.1.2 Nome, função, valor / 4.1.3 Mensagens de status | papéis ARIA nos diálogos e `role="status"`/`role="alert"` nas notificações. |
| 1.4.3 Contraste mínimo | paleta centralizada em `frontend/src/styles/variables.css` (tokens `--cor-*`); **pares específicos a confirmar com ferramenta** na verificação manual (ver Gaps). |

## Gaps e próximos passos

Honestidade sobre o que ainda **não** está fechado:

- **Rodada manual de WAVE/Lighthouse**: a metodologia e a tabela estão prontas; a
  execução no navegador e o registro das notas são um passo humano, ainda a
  preencher.
- **Contraste**: os tokens de cor estão centralizados, mas as razões de contraste
  de cada par (texto/fundo, selos de status) ainda não foram medidas com
  ferramenta — incluir na rodada manual.
- **Teste com leitor de tela real** (NVDA/VoiceOver) ponta a ponta: pendente.
- **Evolução possível**: incorporar `axe-core` à suíte Cypress para uma checagem
  automática de acessibilidade na CI (não incluído nesta fatia para não alterar
  dependências; fica como recomendação).

## Referências

- WCAG 2.1 — https://www.w3.org/TR/WCAG21/ (referência de critérios AA).
- WebAIM WAVE — ferramenta de avaliação manual.
- Lighthouse (Chrome DevTools) — auditoria de acessibilidade.
