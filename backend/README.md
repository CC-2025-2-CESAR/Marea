# Backend Maréa

API do projeto Maréa, construída com Django e Django REST Framework. Nesta etapa o backend
está apenas preparado para evoluções futuras (ainda não há rotas de API nem autenticação).

## Requisitos

- Python 3.12 ou superior
- pip

## Configuração

Criar o ambiente virtual:

```
python -m venv venv
```

Ativar o ambiente virtual no Windows:

```
venv\Scripts\activate
```

Instalar as dependências:

```
pip install -r requirements.txt
```

## Rodar o servidor

Aplicar as migrações:

```
python manage.py migrate
```

Iniciar o servidor de desenvolvimento:

```
python manage.py runserver
```

O backend ficará disponível em `http://127.0.0.1:8000/`.

## Estrutura

- `manage.py` — utilitário de linha de comando do Django.
- `marea_api/` — configuração do projeto (settings, urls, wsgi, asgi).
- `requirements.txt` — dependências do backend.

O banco local é SQLite (`db.sqlite3`). Para produção, recomenda-se PostgreSQL no futuro.
