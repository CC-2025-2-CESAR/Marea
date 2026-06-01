# Plano de resposta a incidente de segurança — Amare

Incidente de segurança é qualquer evento que comprometa a confidencialidade, a
integridade ou a disponibilidade de dados pessoais (acesso indevido, vazamento,
perda, exposição pública). A LGPD prevê a comunicação de incidentes que possam
gerar risco ou dano relevante às titulares.

## 1. Identificar

Sinais de alerta: acesso indevido a dados, exposição pública de dado pessoal,
credencial vazada, banco acessível sem autorização, comportamento anômalo de
conta. Qualquer pessoa do time que perceber deve registrar o que viu (data,
hora, o que aconteceu) e acionar a etapa 2.

## 2. Avisar o time

Comunicar imediatamente a pessoa responsável pelo projeto e a professora
orientadora. Não tentar "esconder" ou resolver sozinha sem registrar.

## 3. Conter

- Revogar credenciais comprometidas (trocar `DJANGO_SECRET_KEY`, senha do
  banco, tokens).
- Se necessário, tirar o serviço do ar temporariamente.
- Bloquear a origem do acesso indevido, se identificada.

## 4. Preservar evidências

Guardar logs e registros relevantes antes de qualquer limpeza, para entender o
que aconteceu e o alcance.

## 5. Avaliar o impacto

Responder: quais dados foram afetados? Havia dado sensível? Quantas titulares?
O dado foi efetivamente acessado/exposto ou só ficou vulnerável?

## 6. Comunicar

Se o incidente puder gerar risco ou dano relevante às titulares, comunicar as
pessoas afetadas e a ANPD, conforme a LGPD. Em contexto acadêmico, comunicar a
orientação do curso e documentar a decisão.

## 7. Registrar e aprender

Registrar o incidente, a causa raiz e a correção aplicada. Atualizar o
[`ripd-simplificado.md`](ripd-simplificado.md) com a nova medida de mitigação
para que o mesmo problema não se repita.
