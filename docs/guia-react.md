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
├── pages/         páginas da aplicação
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
