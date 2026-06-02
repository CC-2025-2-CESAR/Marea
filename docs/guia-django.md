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
CORS_ALLOWED_ORIGINS = _env_lista(
    'DJANGO_CORS_ALLOWED_ORIGINS',
    'http://localhost:5173,http://127.0.0.1:5173',
)
```

Localmente o padrão já cobre o Vite. Em produção, defina a variável de ambiente
`DJANGO_CORS_ALLOWED_ORIGINS` com o domínio real (separado por vírgulas).

O mesmo padrão — variável de ambiente com fallback seguro para desenvolvimento —
vale para `SECRET_KEY` (`DJANGO_SECRET_KEY`), `DEBUG` (`DJANGO_DEBUG`),
`ALLOWED_HOSTS` (`DJANGO_ALLOWED_HOSTS`) e o banco (`DATABASE_URL`). As variáveis
estão documentadas em `backend/.env.example`; sem nenhuma delas, o backend roda
em SQLite com `DEBUG=True`. Com `DJANGO_DEBUG=False`, o `settings.py` liga
automaticamente HTTPS obrigatório, HSTS e cookies seguros.

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

Cria os dados fictícios de demonstração: as pacientes-persona `renata`
(Renata Cegonha) e `amanda` (Amanda Coelho), a médica `medica_teste`
(Dra. Helena Costa) e a administradora `admin_teste` — todas com senha
`amare123`. Também cria as especialidades, o vínculo Médica↔Paciente e, para
cada paciente, as consultas e medicamentos de demonstração (ligados por
relacionamento, sem PK fixa). Remove a conta legada `paciente_teste`, se
existir. É idempotente — pode rodar várias vezes sem duplicar registros.
Apenas para desenvolvimento e demonstração; nunca usar com dados reais.

### Controle de acesso por papel (RBAC)

As permissões por papel ficam em `backend/usuarios/permissions.py`, lendo
`request.user.perfil.tipo_usuario`:

- `IsPaciente` — libera só pacientes.
- `IsMedica` — libera só médicas.
- `IsMedicaOuAdmin` — libera médicas e administradoras (e superusuária do
  Django). Preparada para a futura área administrativa.

`perfil_view` agora usa `@permission_classes([IsPaciente])`: médicas e admins
recebem 403 (antes a view criava um `Paciente` para qualquer usuário, o que
misturava papéis). O controle vive no backend — o frontend nunca é a única
barreira.

O login tem limite de tentativas por IP (`LoginThrottle`, um
`AnonRateThrottle` com `rate = '10/min'` embutido na classe), mitigando força
bruta. A mensagem de erro é genérica ("Usuário ou senha inválidos.") para não
revelar se o usuário existe.

Os testes de acesso estão em `backend/usuarios/tests.py` (paciente acessa o
perfil, médica recebe 403, anônimo recebe 401).

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
- As especialidades e as consultas de exemplo são criadas pelo seed
  `criar_usuarios_teste` (ligadas a cada paciente por relacionamento), e não
  mais por fixture com PK fixa.

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

As especialidades e as consultas de demonstração vêm do seed:

```
python manage.py migrate
python manage.py criar_usuarios_teste
```

Para cadastrar consultas novas, use o Django Admin em
`http://localhost:8000/admin/consultas/consulta/` ou a área da médica.

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
- Os medicamentos de exemplo são criados pelo seed `criar_usuarios_teste`,
  coerentes com cada persona (ácido fólico e gonadotrofina para a Renata;
  progesterona e AAS para a Amanda, entre outros).

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

Os medicamentos de demonstração vêm do seed:

```
python manage.py migrate
python manage.py criar_usuarios_teste
```

Para cadastrar medicamentos novos sem migration, use o Django Admin em
`http://localhost:8000/admin/medicamentos/medicamento/` ou a área da médica.

## App `area_medica`

Quinta app real do backend (PROJ-19 e PROJ-20). É a área da médica: deixa a
médica acompanhar e gerenciar as pacientes **vinculadas a ela**, com escopo por
objeto garantido no backend (ponto sensível de LGPD).

Arquivos relevantes:

- `backend/area_medica/views.py` — views `@api_view` com
  `@permission_classes([IsMedicaOuAdmin])`. O escopo é resolvido em cada
  requisição: a administradora vê todas as pacientes; a médica vê apenas as com
  `medica_responsavel` igual a ela; qualquer outra origem não vê nenhuma.
  Acessar uma paciente fora do escopo devolve 404 (não 403, para não vazar IDs).
- `backend/area_medica/serializers.py` — `PacienteResumoSerializer` (lista, com
  contadores) e `PacienteDetalheSerializer` (detalhe, com consultas e
  medicamentos aninhados, reaproveitando os serializers das apps `consultas` e
  `medicamentos`); serializers próprios de entrada para criar consulta e
  medicamento.
- `backend/area_medica/tests.py` — cobre acesso permitido **e** negado: médica
  só lista/abre as suas pacientes; não acessa as de outra; não cria registros
  fora do escopo; paciente recebe 403; anônimo recebe 401; admin vê todas.

O vínculo Médica↔Paciente é o campo `Paciente.medica_responsavel`
(`backend/usuarios/models.py`), explícito e independente das consultas.

### Endpoints

```
GET  /api/medica/pacientes/                    →  pacientes no escopo de quem pede
GET  /api/medica/pacientes/<id>/               →  detalhe (dados, consultas, medicamentos)
POST /api/medica/pacientes/<id>/consultas/     →  agenda consulta para a paciente
POST /api/medica/pacientes/<id>/medicamentos/  →  cadastra medicamento para a paciente
```

Todos exigem papel de médica ou administradora (`IsMedicaOuAdmin`).
