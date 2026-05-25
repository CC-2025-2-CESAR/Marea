# Guia do Django

Estrutura básica do backend do Maréa.

> A primeira app real do backend é a `dicionario`, que expõe os termos médicos via API REST
> (PROJ-3 e PROJ-4). O restante das funcionalidades segue como preparação para evoluções
> futuras.

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

## Onde ficam as rotas da API

As rotas são registradas em `backend/marea_api/urls.py`, sob o prefixo `api/`.
A configuração do projeto (apps instalados, banco, idioma) fica em
`backend/marea_api/settings.py`.

O banco local é SQLite. Para produção, recomenda-se migrar para PostgreSQL no futuro.

## App `dicionario`

Primeira app real do backend, responsável pelos termos médicos do glossário.

Arquivos relevantes:

- `backend/dicionario/models.py` — define o model `TermoDicionario` com `termo` único,
  `definicao`, `categoria`, `exemplo`, `artigos_relacionados` (JSONField), `ativo`
  e timestamps.
- `backend/dicionario/admin.py` — registra o model no Django Admin com filtros e busca.
- `backend/dicionario/serializers.py` — `TermoDicionarioSerializer` (ModelSerializer).
- `backend/dicionario/views.py` — views baseadas em função (`@api_view`), sem usar
  Generic Views, para deixar o fluxo explícito.
- `backend/dicionario/urls.py` — rotas internas da app.
- `backend/dicionario/fixtures/termos_iniciais.json` — 13 termos prontos para semear o
  ambiente de desenvolvimento, distribuídos entre as categorias Doença, Remédio,
  Exame, Instrumento, Procedimento e Biologia.

### Campo `artigos_relacionados`

JSONField que guarda uma lista de objetos com `titulo` e `url`:

```json
[
  {"titulo": "Etapas da FIV passo a passo", "url": "https://exemplo.com/fiv"},
  {"titulo": "Mitos comuns sobre FIV", "url": "#"}
]
```

Pode ficar vazio (default `[]`). O serializer expõe o campo direto, e o
frontend renderiza cada item como link na seção 'Artigos relacionados' do
card. Para apontar para páginas reais no futuro, troque o `url` `#` pelo
caminho final no banco (via Admin) — não exige migration.

Endpoints:

```
GET  /api/dicionario/termos/                lista termos ativos
GET  /api/dicionario/termos/?busca=fiv      filtra por termo, definição ou categoria
GET  /api/dicionario/termos/<id>/           detalhe de um termo (404 se inativo/inexistente)
```

Para carregar os termos iniciais:

```
python manage.py migrate
python manage.py loaddata termos_iniciais
```

Para cadastrar novos termos sem migrations, use o Django Admin em
`http://localhost:8000/admin/dicionario/termodicionario/` (precisa de um superusuário,
criado com `python manage.py createsuperuser`).

## CORS

A app `corsheaders` (django-cors-headers) está habilitada para liberar o frontend
(Vite em `http://localhost:5173`) a chamar os endpoints. A configuração fica em
`backend/marea_api/settings.py`:

```python
CORS_ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
]
```

Em produção, ampliar essa lista para o domínio real.
