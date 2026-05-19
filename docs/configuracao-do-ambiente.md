# Configuração do ambiente

Guia para configurar o projeto Maréa do zero.

## Requisitos

Instale antes de começar:

- Python 3.12 ou superior
- Node.js 20 ou superior (inclui o npm)
- Git
- VS Code

Confira as versões:

```
python --version
node --version
npm --version
git --version
```

## Clonar o repositório

```
git clone <url-do-repositorio>
cd Marea
```

## Backend (Django)

Entre na pasta do backend:

```
cd backend
```

Crie o ambiente virtual:

```
python -m venv venv
```

Ative o ambiente virtual no Windows:

```
venv\Scripts\activate
```

Instale as dependências:

```
pip install -r requirements.txt
```

Aplique as migrações:

```
python manage.py migrate
```

Rode o servidor:

```
python manage.py runserver
```

O backend fica em `http://127.0.0.1:8000/`.

## Frontend (React + Vite)

Abra outro terminal e entre na pasta do frontend:

```
cd frontend
```

Instale as dependências:

```
npm install
```

Rode o projeto:

```
npm run dev
```

O frontend fica em `http://localhost:5173/`.

## Verificar se está funcionando

- Backend: abra `http://127.0.0.1:8000/` e veja a página inicial do Django.
- Frontend: abra `http://localhost:5173/` e veja a tela de login do Maréa.

Se as duas páginas abrirem sem erro, o ambiente está pronto.
