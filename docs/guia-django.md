# Guia do Django

Estrutura básica do backend do Maréa.

> Nesta etapa o backend está apenas preparado para evoluções futuras. Ainda não há rotas
> de API nem autenticação implementadas.

## Para que serve o Django

O Django é o framework do backend. Ele organiza o servidor, o acesso ao banco de dados
e, no futuro, as regras de negócio da plataforma.

## Para que serve o Django REST Framework

O Django REST Framework (DRF) é a camada usada para construir a API. Ele facilita expor
dados do backend em formato JSON para o frontend consumir.

## O que é uma API

API é a ponte entre o frontend e o backend. O frontend faz uma requisição (por exemplo,
"fazer login") e a API responde com dados ou com o resultado da operação.

## Para que serve o manage.py

O `manage.py` é o utilitário de linha de comando do Django. É por ele que rodamos o
servidor, aplicamos migrações e criamos usuários.

## Rodar o servidor

Dentro da pasta `backend`, com o ambiente virtual ativo:

```
python manage.py runserver
```

## Rodar migrations

Migrations criam e atualizam as tabelas do banco:

```
python manage.py migrate
```

Quando houver modelos novos, gere as migrations antes:

```
python manage.py makemigrations
```

## Criar um superusuário (futuramente)

Quando existir a área administrativa, crie um usuário admin com:

```
python manage.py createsuperuser
```

## Onde ficarão as rotas da API

As rotas serão registradas em `backend/marea_api/urls.py`, sob o prefixo `api/`.
A configuração do projeto (apps instalados, banco, idioma) fica em
`backend/marea_api/settings.py`.

O banco local é SQLite. Para produção, recomenda-se migrar para PostgreSQL no futuro.
