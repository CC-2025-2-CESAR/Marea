# Guia do React

Como o frontend do Maréa está organizado.

## O papel do React

O React monta a interface da plataforma em componentes reutilizáveis. Cada parte da tela
(campo, botão, página) é um componente.

## O papel do Vite

O Vite é a ferramenta de build e o servidor de desenvolvimento. Ele roda o projeto em
modo local com recarga automática e gera a versão final para produção.

## A pasta `src`

É onde fica todo o código do frontend.

```
src/
├── assets/        imagens e o logo
├── components/    componentes reutilizáveis
├── layouts/       estruturas visuais compartilhadas
├── pages/         páginas da aplicação
├── routes/        configuração das rotas
├── styles/        estilos globais e variáveis de cor
├── App.jsx        componente raiz
└── main.jsx       ponto de entrada
```

## A pasta `components`

Guarda componentes reutilizados em várias telas. Cada componente tem sua própria pasta
com o `.jsx` e o `.css`.

```
components/
├── Button/
│   ├── Button.jsx
│   └── Button.css
├── IconeLupa/
│   └── IconeLupa.jsx
└── InputField/
    ├── InputField.jsx
    └── InputField.css
```

`IconeLupa` é um SVG inline reutilizável (props: `tamanho`, `className`). É usado pela
busca do header global (`SearchBar`) e pela busca interna da página do Dicionário.

## A pasta `pages`

Guarda as telas completas. A página de login fica em:

```
src/pages/Login/Login.jsx
src/pages/Login/Login.css
```

As páginas internas atuais ficam em pastas próprias, como `Home`, `Calendario`,
`Dicionario` e `Bot`. Nesta etapa, elas são placeholders.

## A pasta `layouts`

Guarda estruturas visuais reutilizadas por grupos de páginas.

- `AuthLayout`: usado no login, sem sidebar, header ou busca.
- `AppLayout`: usado nas páginas internas, com sidebar, header, busca e área de conteúdo.

Os layouts usam `Outlet` para indicar onde a página da rota atual será renderizada.

## A pasta `routes`

Guarda a configuração de navegação da aplicação.

O arquivo principal é:

```
src/routes/AppRoutes.jsx
```

Ele usa React Router com `BrowserRouter`, `Routes`, `Route` e `Outlet`.

Exemplo simplificado:

```jsx
<Route element={<AppLayout />}>
  <Route path="/" element={<Home />} />
  <Route path="/dicionario" element={<Dicionario />} />
</Route>
```

O componente `App.jsx` apenas chama `AppRoutes`, deixando as rotas centralizadas.

## Como criar um componente

Crie a pasta e o arquivo `.jsx`:

```jsx
function Aviso({ texto }) {
  return <p className="aviso">{texto}</p>
}

export default Aviso
```

## Como importar um componente

```jsx
import Aviso from './components/Aviso/Aviso'

function App() {
  return <Aviso texto="Olá" />
}
```

## Como organizar o CSS

- Cada componente importa o seu próprio `.css`.
- As cores ficam em `src/styles/variables.css` como variáveis (ex.: `var(--cor-creme)`).
- Estilos gerais (fundo, fonte, reset) ficam em `src/styles/global.css`.

## Animações com Motion

A biblioteca [Motion](https://motion.dev/) é usada para microinterações e
transições suaves. O import canônico é:

```jsx
import { motion, AnimatePresence } from 'motion/react'
```

Uso atual no Maréa:

- `src/pages/Login/Login.jsx`: entrada suave do card, do logo e do bloco de
  feedback (com `AnimatePresence` para animação de saída).
- `src/components/Button/Button.jsx`: microinterações de `whileHover` e
  `whileTap` no botão.

Regra geral: usar Motion com moderação. Animações curtas (até 0,35 s) e
discretas ajudam a leitura. Animações longas ou exageradas atrapalham,
sobretudo em campos de formulário e listas. Mais detalhes no
[guia da Motion](guia-motion.md).

## Camada de serviços HTTP

Toda chamada à API do Maréa passa pela pasta `src/services/`:

```
src/services/
├── api.js                  wrapper de fetch com URL base, auth e tratamento de erro
├── authService.js          login, refresh e dados do usuário autenticado
├── dicionarioService.js    chamadas específicas do dicionário
└── perfilService.js        leitura e atualização do perfil
```

A URL base é lida da variável de ambiente `VITE_API_BASE_URL`, com fallback para
`http://localhost:8000/api`. O arquivo `frontend/.env.example` mostra o formato.
Crie um `frontend/.env` local com o valor que você quiser usar — esse arquivo é
ignorado pelo Git.

Uso típico em uma página:

```jsx
import { listarTermos } from '../../services/dicionarioService'

const dados = await listarTermos('fiv')
```

Para criar um novo serviço, reuse `requisicao` de `api.js`:

```js
import { requisicao } from './api'

function listarConsultas() {
  return requisicao('/consultas/')
}
```

## Autenticação e perfil

O frontend usa JWT contra o backend (ver guia do Django). A infra-estrutura
de auth vive em três lugares:

```
src/contexts/
├── AuthContext.jsx         provider que guarda usuário e expõe login/logout
├── authStorage.js          constante CHAVE_STORAGE compartilhada
└── useAuth.js              hook useAuth para consumir o contexto

src/components/ProtectedRoute/
└── ProtectedRoute.jsx      redireciona para /login se não estiver autenticado
```

O `App.jsx` envolve toda a aplicação em `<AuthProvider>`. O `AppRoutes.jsx`
embrulha o `AppLayout` em `<ProtectedRoute>` — todas as rotas internas ficam
bloqueadas para quem não tem sessão.

```jsx
<Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
  <Route index element={<Home />} />
  <Route path="/perfil" element={<Perfil />} />
  ...
</Route>
```

### Fluxo de login

1. `Login.jsx` chama `useAuth().login(usuario, senha)`.
2. O contexto chama `authService.login` (`POST /api/auth/login/`).
3. A resposta `{access, refresh, usuario}` é salva em
   `localStorage['marea_auth']` e no estado do provider.
4. A página de login navega para `/perfil`.

### Auto-refresh em 401

`services/api.js` injeta `Authorization: Bearer <access>` em toda chamada
quando há sessão salva. Se a resposta vier 401 com sessão presente, tenta
uma vez `POST /api/auth/refresh/`. Se o refresh funcionar, refaz a chamada
original. Se falhar, limpa o `localStorage` e dispara o evento
`marea:logout` — o `AuthContext` escuta e o `ProtectedRoute` redireciona.

### Logout

A `Sidebar` tem um botão "Sair" (ícone `IconeLogout`) no rodapé. Ele chama
`useAuth().logout()` e navega para `/login`.

### Por que `useAuth.js` separado do `AuthContext.jsx`

A regra ESLint `react-refresh/only-export-components` pede que arquivos
`.jsx` exportem apenas componentes (para o Fast Refresh funcionar bem).
Por isso o hook `useAuth` e a constante `CHAVE_STORAGE` ficam em arquivos
`.js` próprios — o `.jsx` exporta só o `AuthProvider` e o `AuthContext`.

## Layout mobile

O frontend é desktop-first, mas o `AppLayout` adapta a navegação para
celular abaixo de 768px.

### Breakpoints padronizados

Os CSS do projeto usam três pontos de corte:

- **480px**: ajustes para celulares pequenos (iPhone SE/12 mini).
- **768px (`max-width: 767px`)**: transição entre mobile e tablet — é o
  ponto onde a sidebar lateral desaparece e o drawer entra em cena.
- **1024px**: transição entre tablet e desktop (afeta principalmente o
  grid de cards da Home).

Variáveis CSS não funcionam dentro de `@media`, então isso é uma
convenção — siga os mesmos números em CSS novos.

### Drawer no AppLayout

`src/layouts/AppLayout/AppLayout.jsx` mantém um estado `menuAberto` e
renderiza o drawer e o backdrop dentro de `<AnimatePresence>` quando ele
está aberto. O drawer reutiliza o componente `<Sidebar>` em modo `drawer`
(sem reescrever a estrutura).

```jsx
<AnimatePresence>
  {menuAberto ? (
    <>
      <motion.div className="app-layout__backdrop" onClick={fecharMenu} />
      <motion.div className="app-layout__drawer">
        <Sidebar modoDrawer onFechar={fecharMenu} />
      </motion.div>
    </>
  ) : null}
</AnimatePresence>
```

O `Header` recebe `onAbrirMenu` por prop e mostra o botão hambúrguer
(`IconeMenu`) à esquerda da marca. O botão tem `display: none` no
desktop via CSS (`@media (min-width: 768px)`).

### Sidebar reaproveitada

`Sidebar.jsx` aceita props opcionais `modoDrawer` e `onFechar`. Sem props,
funciona como sidebar lateral fixa do desktop. Com `modoDrawer`, ganha um
botão "X" no topo (`IconeFechar`), e cada link da navegação chama
`onFechar()` no `onClick` para fechar o drawer ao navegar.

### Por que o estado fica no `AppLayout` e não em Context

Apenas o `Header` (que dispara `onAbrirMenu`) e o `Sidebar` (que recebe
`onFechar`) precisam saber do estado. Usar Context global seria overkill —
duas props locais resolvem.

### Fechamento automático

- **Clique num link da navegação** → o `Sidebar` chama `onFechar` no
  `onClick` do `NavLink`.
- **Botão voltar do navegador** → o `AppLayout` escuta `popstate` num
  `useEffect` (sem dependências) e fecha o drawer.
- **Tecla Esc** → escutado em outro `useEffect` que só roda enquanto
  `menuAberto` é `true`. O mesmo efeito trava o scroll do `<body>` para
  evitar rolagem por baixo do overlay.

### Tap targets e tipografia mínima

Botões e links da navegação têm `min-height: 44px` (recomendação Apple
HIG/WCAG). Inputs (`.campo-input` e os inputs das páginas de Perfil e
Dicionário) usam `font-size: 16px` no mobile — abaixo disso, o Safari do
iOS dá zoom automático ao focar.

## Microinterações e transições

Esta seção cobre o "polimento de UX": as decisões pequenas que dão
sensação de produto cuidadoso. Os princípios gerais são:

- **Sutil sempre vence chamativo.** Durações curtas (150–250 ms), easing
  `easeOut`, e nada que segure a paciente esperando algo "terminar".
- **Respeitar quem pediu menos movimento.** O sistema operacional pode
  sinalizar isso, e o frontend obedece em três camadas (ver abaixo).
- **Padronizar antes de espalhar.** Variáveis CSS e `MotionConfig`
  global garantem que todos os componentes tenham o mesmo "tom".

### Variáveis CSS de duração e easing

Em `src/styles/variables.css`:

```css
--duracao-rapida: 0.15s;   /* hover, focus, tap */
--duracao-media: 0.2s;     /* feedbacks, transições de página */
--duracao-lenta: 0.35s;    /* entradas de tela (login) */
--easing-saida: ease-out;
```

Motion não lê variáveis CSS — então os componentes `motion.*` usam os
mesmos números literais (`0.15`, `0.2`, `0.35`) para manter o mesmo
"tom" do CSS puro.

### Transição entre páginas (`PageTransition`)

`src/components/PageTransition/PageTransition.jsx` envolve o `<Outlet />`
do `AppLayout`. Cada troca de rota faz um fade + microdeslocamento
vertical (200 ms, `easeOut`). As páginas em si (`Home`, `Perfil`,
`Dicionario`, …) **não mudam** — continuam como `<section>` normais.

Detalhes importantes:

- Usa `AnimatePresence mode="wait"` para a página antiga sair antes da
  nova entrar (sem overlap visual).
- Usa `initial={false}` para não animar a montagem inicial do app — só
  trocas de rota subsequentes.
- A `key` é `useLocation().pathname`.
- Se a paciente pediu redução de movimento, devolve `children` direto
  (sem `motion.div`).

### `prefers-reduced-motion` em três camadas

1. **`MotionConfig reducedMotion="user"`** em `src/App.jsx` envolve
   toda a árvore — todos os `motion.*` respeitam a preferência do SO
   automaticamente.
2. **`@media (prefers-reduced-motion: reduce)`** em
   `src/styles/global.css` desliga animações e transições do CSS puro.
3. **`useReducedMotion()`** dentro de `PageTransition` e `SelectField`
   devolve markup sem `motion.*` quando a paciente prefere menos
   movimento (cobre o caso de `MotionConfig` não pegar componentes muito
   aninhados).

### Microinterações da Sidebar

- **Indicador lateral** no link ativo: pseudo-elemento `::before` com
  barra de 3×18 px que entra com `scaleY()` suave.
- **Hover:** background rosa claro + `translateX(2px)` sutil.
- **Foco visível:** `box-shadow` rosa (3 px) em vez de outline.
- **Tap (mobile):** `scale(0.98)` via `:active`.

Por que **não** usar `layoutId` da Motion para mover o indicador entre
links: quando o drawer mobile está aberto, a `<Sidebar>` é renderizada
duas vezes (desktop hidden + drawer). Dois `layoutId` iguais brigam.

### `SelectField` — quando o select nativo não basta

`src/components/SelectField/SelectField.jsx` substitui o `<select>`
nativo em campos onde a abertura do dropdown precisa ser animada. Hoje
é usado apenas no tipo sanguíneo do perfil.

Recursos:

- ARIA `combobox` + `listbox` + `option` com `aria-selected` e
  `aria-activedescendant`.
- Teclado: setas ↑/↓, Enter/Espaço (abre ou confirma), Esc (fecha e
  devolve foco), Tab (fecha e segue o fluxo).
- Click-outside via listener global de `mousedown`.
- Animação Motion: opacity + scale + y curto (150 ms, `easeOut`).
- `data-cy` no `<button>` raiz; cada `<li>` ganha
  `data-cy="{dataCy}-opcao-{valor}"`.

O `<select>` nativo continua sendo a opção certa para casos onde o
dropdown nativo é mais útil (ex.: listas muito longas no mobile, onde
o dropdown OS dá scroll mais fluido). Use `SelectField` só quando a
animação fizer diferença real.

### Máscara de telefone (`utils/formatadores.js`)

`src/utils/formatadores.js` expõe:

- `somenteNumeros(valor)` — remove tudo que não é dígito.
- `formatarTelefone(valor)` — aplica máscara `(XX) XXXX-XXXX` (10
  dígitos) ou `(XX) XXXXX-XXXX` (11 dígitos). Limite 11.
- `normalizarTelefone(valor)` — útil se algum dia o backend pedir só
  dígitos.
- `telefoneValido(valor)` — aceita vazio (campo opcional) ou exatamente
  10/11 dígitos.

No Perfil, a máscara é aplicada no `onChange`:

```jsx
onChange={(e) => atualizarCampo('telefone', formatarTelefone(e.target.value))}
```

Limitação conhecida: editar no meio da string pode fazer o cursor
saltar para o fim. Corrigir exigiria rastrear a posição do caret —
fica para uma iteração futura se virar incômodo real.
