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

Carregue os dados iniciais (termos do dicionário, especialidades e consultas
de exemplo da paciente de teste):

```
python manage.py loaddata termos_iniciais
python manage.py loaddata consultas_iniciais
```

Crie os usuários fictícios para login local (`paciente_teste`, `medica_teste`
e `admin_teste`, todos com senha `amare123`):

```
python manage.py criar_usuarios_teste
```

Esse comando é idempotente — pode rodar de novo sem duplicar registros.

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

A porta `5173` é fixa no `vite.config.js` (`strictPort: true`) porque o
backend libera CORS apenas para ela e o Cypress usa esse `baseUrl`. Se a
porta já estiver ocupada por outro processo, o Vite **falha** em vez de
mudar para 5174 — encerre o processo antigo (no Windows:
`netstat -ano | findstr :5173` + `taskkill /PID <pid> /F`) e rode
`npm run dev` de novo.

## Verificar se está funcionando

- Backend: abra `http://127.0.0.1:8000/` e veja a página inicial do Django.
- Frontend: abra `http://localhost:5173/` e veja a tela de login do Maréa.

Se as duas páginas abrirem sem erro, o ambiente está pronto.
