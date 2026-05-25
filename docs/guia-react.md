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
