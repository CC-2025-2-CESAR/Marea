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

## App `usuarios` (autenticação e perfis)

Segunda app real do backend. Cuida da autenticação (JWT) e dos dados de
perfil dos três tipos de usuário previstos: paciente, médica e administradora.

Arquivos relevantes:

- `backend/usuarios/models.py` — três models:
  - `PerfilUsuario` (OneToOne com o `User` padrão do Django) com `tipo_usuario`,
    `nome_completo`, `telefone`, `foto_url`, `criado_em`, `atualizado_em`.
  - `Paciente` (OneToOne com `PerfilUsuario`) com `data_nascimento`,
    `tipo_sanguineo` (choices), `medicamentos_em_uso`, `observacoes_medicas`.
  - `Medica` (OneToOne com `PerfilUsuario`) com `crm` e `especialidade`.
- `backend/usuarios/serializers.py` — `UsuarioBasicoSerializer` (id/username/
  email/tipo/nome) e `PerfilPacienteSerializer` (perfil completo, com `update`
  que aceita apenas os campos editáveis pela paciente).
- `backend/usuarios/views.py` — `login_view`, `refresh_view`, `me_view` e
  `perfil_view`. Todas com `@api_view` (sem Generic Views, sem `ModelViewSet`).
- `backend/usuarios/urls.py` — rotas locais da app.
- `backend/usuarios/admin.py` — registra os três models com inlines de
  Paciente e Medica dentro de PerfilUsuario.

### Por que `User` padrão + `PerfilUsuario` em vez de `AUTH_USER_MODEL` custom

`AUTH_USER_MODEL` precisa ser definido antes da primeira migration; trocar
depois é caro. Como o projeto já tinha migrations rodadas, o caminho mais
seguro foi manter o `User` padrão e pendurar um `OneToOne` para os dados
específicos. O Django Admin lida com isso naturalmente.

A criação do `PerfilUsuario` é explícita — não há `post_save` signal. Fica
mais fácil de seguir o código e evita "mágica" silenciosa.

### Endpoints

```
POST /api/auth/login/      {username, password}  →  {access, refresh, usuario}
POST /api/auth/refresh/    {refresh}             →  {access}
GET  /api/auth/me/                               →  dados do usuário autenticado
GET  /api/perfil/                                →  perfil completo da paciente
PATCH /api/perfil/         {nome, telefone, ...} →  perfil atualizado
```

Os campos editáveis pela paciente são `nome_completo`, `telefone`,
`data_nascimento` e `tipo_sanguineo`. Email vem do `User.email` e fica
read-only no serializer. Medicamentos e observações são read-only também
(atualização passa pelo Django Admin).

### JWT com `djangorestframework-simplejwt`

A autenticação usa JSON Web Tokens via o pacote `djangorestframework-simplejwt`.
Configuração em `backend/marea_api/settings.py`:

```python
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'AUTH_HEADER_TYPES': ('Bearer',),
}
```

`IsAuthenticated` é o padrão — para deixar um endpoint público (como o
dicionário), adicione `@permission_classes([AllowAny])` na view.

A view de login não usa `TokenObtainPairView` da biblioteca: ela é
function-based e gera o par diretamente com `RefreshToken.for_user(user)`,
mantendo a regra do projeto de não usar Generic Views.

### Dívida técnica conhecida

O frontend guarda `access` + `refresh` em `localStorage`. Em projeto
acadêmico isso é aceitável e simplifica o fluxo. Em produção, o refresh
token deveria ficar em cookie `httpOnly` para reduzir o risco de XSS.

### Management command `criar_usuarios_teste`

```
python manage.py criar_usuarios_teste
```

Cria `paciente_teste`, `medica_teste` e `admin_teste` com senha `amare123`
e dados fictícios. É idempotente — pode rodar várias vezes sem duplicar
registros. Apenas para desenvolvimento local; nunca usar em produção.

## App `consultas`

Terceira app real do backend. Cuida das consultas agendadas das pacientes e
das especialidades médicas usadas para classificá-las. Alimenta tanto a
página `/calendario` no frontend quanto o banner de "Próxima consulta" na
página inicial.

Arquivos relevantes:

- `backend/consultas/models.py` — dois models:
  - `Especialidade` com `nome` único, `descricao`, `ativo` e timestamps.
  - `Consulta` com FK para `Paciente` (obrigatória), `Medica` (opcional),
    `Especialidade` (opcional), `data_horario`, `local`, `observacoes` e
    `status` (choices: `agendada`, `realizada`, `cancelada`, `remarcada`).
- `backend/consultas/serializers.py` — `ConsultaSerializer` traz
  `especialidade_nome`, `medica_nome` e `status_label` resolvidos, para
  o frontend não precisar fazer joins.
- `backend/consultas/views.py` — duas views com `@api_view`:
  - `listar_consultas`: todas as consultas da paciente autenticada,
    ordenadas por `data_horario`.
  - `listar_proximas_consultas`: até 3 consultas com status `agendada` nos
    próximos 7 dias. Devolve `[]` se o usuário não for paciente, para o
    banner sumir naturalmente.
- `backend/consultas/admin.py` — `EspecialidadeAdmin` e `ConsultaAdmin`
  com `date_hierarchy`, filtros por status/especialidade e busca por nome
  da paciente/médica.
- `backend/consultas/fixtures/consultas_iniciais.json` — 3 especialidades
  e 4 consultas de exemplo (2 agendadas futuras, 1 realizada, 1 cancelada)
  para `paciente_teste`.

### Endpoints

```
GET /api/consultas/                  →  lista todas as consultas da paciente autenticada
GET /api/consultas/proximas/         →  até 3 consultas agendadas nos próximos 7 dias
```

Ambos exigem autenticação JWT (`@permission_classes([IsAuthenticated])`).
Usuários sem perfil de paciente recebem 404 amigável em `/api/consultas/`
e lista vazia em `/api/consultas/proximas/` (para o banner sumir sem
quebrar a Home).

### Carregar dados iniciais

```
python manage.py migrate
python manage.py loaddata consultas_iniciais
```

A fixture assume que `paciente_teste` (id 1) e `medica_teste` (id 1) já
existem — rode `criar_usuarios_teste` antes. Para cadastrar consultas
novas, use o Django Admin em
`http://localhost:8000/admin/consultas/consulta/`.

## App `medicamentos`

Quarta app real do backend. Cuida do checklist diário de remédios da
paciente. Alimenta tanto a página `/medicamentos` quanto o card
"Lembretes" no `/calendario`.

Arquivos relevantes:

- `backend/medicamentos/models.py` — um único model `Medicamento`:
  FK para `Paciente`, `nome`, `dose`, `horario` (TimeField, opcional),
  `instrucoes`, `tomado_hoje` (BooleanField), `data_ultima_marcacao`
  (DateField), `ativo`, timestamps.
  - O método `esta_tomado_hoje()` retorna `True` apenas se a última
    marcação foi feita **hoje**. Resolve o reset diário sem precisar
    de cron: se a paciente marcou ontem e abre a checklist hoje, o
    serializer já devolve `tomado=False`.
  - O método `marcar_tomado(novo_estado)` atualiza estado e data
    atomicamente em um único `save(update_fields=...)`.
- `backend/medicamentos/serializers.py` — `MedicamentoSerializer` com
  campo computado `tomado` (a partir de `esta_tomado_hoje()`).
- `backend/medicamentos/views.py` — duas views `@api_view`:
  - `listar_medicamentos` (GET) — medicamentos ativos da paciente
    autenticada.
  - `alternar_tomada` (PATCH) — recebe `pk`, valida ownership e alterna
    o estado. Body opcional `{ "tomado": true|false }` para set explícito;
    sem body, faz toggle.
- `backend/medicamentos/admin.py` — `MedicamentoAdmin` com filtros por
  `ativo`/`tomado_hoje`, busca por nome da paciente, e fieldset separado
  para "Estado de hoje".
- `backend/medicamentos/fixtures/medicamentos_iniciais.json` — 4
  medicamentos de exemplo para `paciente_teste`: ácido fólico,
  progesterona, vitamina D e um anti-inflamatório SOS sem horário fixo.

### Endpoints

```
GET   /api/medicamentos/                →  medicamentos ativos da paciente autenticada
PATCH /api/medicamentos/<id>/toma/      →  alterna estado de tomada; aceita { tomado: bool } opcional
```

Ambos exigem autenticação JWT. Usuários sem perfil de paciente recebem
lista vazia em GET e 403 em PATCH. Tentar alterar um medicamento de
outra paciente retorna 404 (não 403, para evitar leak de IDs).

### Reset diário sem cron

O campo `tomado_hoje` continua `True` no banco após uma marcação, mas o
serializer só devolve `tomado=True` se `data_ultima_marcacao == hoje`.
Isso significa que:
- Não precisamos rodar um cron diário para limpar o checklist.
- O histórico (campo `data_ultima_marcacao`) fica preservado para
  futuras telas de "tomei X% dos remédios na semana", sem migration extra.
- A primeira marcação do dia atualiza ambos os campos, então a coerência
  é garantida no PATCH.

### Carregar dados iniciais

```
python manage.py migrate
python manage.py loaddata medicamentos_iniciais
```

Assume que `paciente_teste` (id 1) já existe. Para cadastrar
medicamentos novos sem migration, use o Django Admin em
`http://localhost:8000/admin/medicamentos/medicamento/`.
