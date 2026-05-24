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
└── InputField/
    ├── InputField.jsx
    └── InputField.css
```

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

## Camada de serviços HTTP

Toda chamada à API do Maréa passa pela pasta `src/services/`:

```
src/services/
├── api.js                  wrapper de fetch com URL base e tratamento de erro
└── dicionarioService.js    chamadas específicas do dicionário
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
