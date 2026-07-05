# MVNI HUB — Fase 2: Plataforma MVNO

Escopo enorme (14 fases). Entregar tudo em um único passo geraria migration gigante, risco alto de quebra e review inviável. Proponho **3 sprints sequenciais**, cada um com build limpo, tipos regenerados e testável de forma isolada. Nada existente (Stripe, checkout, comissões, indicação, AuthGuard, Dashboard atual, RLS atuais) é tocado.

---

## Sprint 1 — Fundação (banco + RLS + storage + auditoria)

**Migration única** cria toda a base normalizada, já preparada para White Label (`tenant_id UUID` em toda tabela, default `NULL`, índice — sem forçar multi-tenant agora, mas pronto):

Tabelas novas:
- `operadoras` (nome, slug, cor, logo_url)
- `planos_mvno` (operadora_id, nome, franquia_dados_mb, sms_incluidos, minutos_incluidos, valor_mensal, ativo)
- `mvno_linhas` (numero, iccid, imsi, operadora_id, plano_id, cliente_id, user_id representante, status enum, ativada_em, proximo_vencimento, valor_mensal, tenant_id)
- `mvno_linha_historico` (linha_id, evento enum, descricao, metadata jsonb, actor_id)
- `mvno_faturas` (linha_id, cliente_id, competencia, valor, vencimento, pago_em, status enum, pdf_url, tenant_id)
- `mvno_fatura_itens` (fatura_id, descricao, categoria enum, quantidade, valor_unit, valor_total)
- `mvno_consumos` (linha_id, competencia, dados_mb, sms_qtd, minutos_qtd, roaming_mb)
- `mvno_uploads_faturas` (uploader_id, operadora_id, competencia, arquivo_url, mime, status, total_linhas, processadas, erros_count)
- `mvno_parser_jobs` (upload_id, tipo enum pdf/csv/xlsx/ocr, status, iniciado_em, finalizado_em, resultado jsonb)
- `mvno_parser_logs` (job_id, nivel, mensagem, contexto jsonb)
- `mvno_audit_logs` (actor_id, entidade, entidade_id, acao, antes jsonb, depois jsonb, ip, user_agent)

Enums: `mvno_linha_status`, `mvno_fatura_status`, `mvno_evento_tipo`, `mvno_parser_status`, `mvno_item_categoria`.

**RLS por tabela:**
- Cliente (via `clientes.user_id`) → SELECT em `mvno_linhas`/`mvno_faturas`/`mvno_consumos`/`mvno_linha_historico` apenas onde a linha pertence a um cliente dele.
- Representante → SELECT nas linhas cujo `user_id = auth.uid()` (sem dados financeiros de terceiros: policy separa `mvno_faturas` — representante só vê faturas de linhas próprias).
- Admin/master_admin → ALL via `has_role`/`is_master_admin`.
- Uploads/parser/audit → apenas admin/master.

**Storage:** bucket privado `mvno-faturas` para PDF da operadora e `mvno-faturas-pdf` para PDF individual por cliente. Policies limitam leitura ao owner/admin.

**Grants:** `authenticated` recebe DML nas tabelas de dados; `service_role` recebe ALL em tudo (edge functions).

---

## Sprint 2 — Área do cliente (frontend)

Novas rotas dentro do `AuthGuard` (não gated por `cadastro_pago_em` — são áreas do cliente final, não do representante):
- `/minhas-linhas` — lista com filtros por status, card por linha, drawer de detalhes com histórico timeline.
- `/minhas-linhas/:id` — detalhe completo (número, ICCID, IMSI, plano, consumo, vencimento, timeline).
- `/minhas-faturas` — lista paginada, filtros, download PDF (signed URL 5 min), botão "segunda via".
- `/minhas-faturas/:id` — detalhamento por item + histórico.

Componentes novos:
- `LinhaCard`, `LinhaStatusBadge`, `LinhaTimeline`, `FaturaRow`, `FaturaStatusBadge`, `FaturaDetalhe`, `ConsumoBarras`.

Hooks:
- `useMinhasLinhas`, `useLinha(id)`, `useMinhasFaturas`, `useFatura(id)`, `useSignedFaturaUrl(fatura)`.

Todos com React Query + paginação server-side (`.range()`) + empty/loading/error padronizados.

Dashboard: adicionar bloco "Suas linhas" com cards (total, ativas, suspensas, bloqueadas, próxima fatura, valor mensal, dias restantes) — **novo bloco abaixo** do card de ativação atual, sem tocar no card existente.

---

## Sprint 3 — Admin + parser stub + edge functions

Rotas admin (protegidas por `MASTER_ONLY_ROUTES` já existente):
- `/master/mvno/linhas` — CRUD, filtros, exportação CSV, ações (suspender/cancelar/trocar plano/transferir titularidade).
- `/master/mvno/planos` — CRUD planos.
- `/master/mvno/operadoras` — CRUD operadoras.
- `/master/mvno/uploads` — upload de fatura da operadora, lista de jobs, logs, reprocessar.
- `/master/mvno/auditoria` — visualizador de `mvno_audit_logs`.

Edge Functions novas:
- `mvno-fatura-upload` — recebe arquivo, cria `mvno_uploads_faturas` + `mvno_parser_jobs (status=pending)`, salva no bucket privado.
- `mvno-fatura-parser` — **stub preparado** com switch por MIME (`pdf`/`csv`/`xlsx`). Implementa apenas CSV/XLSX básicos (leitura de colunas mapeadas). PDF/OCR retorna `status=pending_ai` para futura integração. Distribui itens para `mvno_faturas`/`mvno_fatura_itens`/`mvno_consumos` respeitando `cliente_id` — nunca vaza dados de outro CPF.
- `mvno-fatura-signed-url` — gera signed URL 5 min para o cliente baixar seu PDF (verifica ownership via RLS + JWT).
- Todas com CORS, validação Zod, `requireUser`/`requireRole` do `_shared/auth.ts`, logs em `mvno_audit_logs`.

Cron opcional (não neste sprint): job diário que marca faturas vencidas como "atrasada".

---

## Detalhes técnicos

- **White Label ready:** coluna `tenant_id UUID NULL` + índice em toda tabela nova; RLS já referencia `tenant_id` via helper `current_tenant_id()` (function `stable` que hoje retorna NULL, mas pode ser trocada sem migration adicional de policy).
- **Performance:** índices em `(cliente_id, status)`, `(user_id)`, `(linha_id, competencia)`, `(status, proximo_vencimento)`; paginação `.range()`; React Query com `staleTime: 30s`.
- **Segurança:** ownership dupla (RLS + edge re-check), signed URLs com expiração curta, `service_role` só em edge, nenhuma coluna sensível exposta em policies de anon.
- **UX:** padrão shadcn + tokens existentes; dark mode automático; loading/empty/error em todos os componentes; toasts em ações.
- **Não implementar agora:** OCR real, OpenAI, integração APIs de operadora. Arquitetura fica pronta (`parser_jobs.tipo='ocr'` aceito, retorna `pending_ai`).

## Não altero

Stripe · webhook · checkout · comissões · indicação · AuthGuard (só adiciono rotas em `PUBLIC_ROUTES`? não — todas novas são autenticadas) · Dashboard atual (apenas **acrescento** um bloco novo abaixo) · Google login · RLS existentes · Edge Functions atuais.

## Entrega ao fim de cada sprint

- Sprint 1: 1 migration + relatório de tabelas/policies/grants + tipos regenerados.
- Sprint 2: rotas cliente + Dashboard bloco + build limpo + validação Playwright em `/minhas-linhas` e `/minhas-faturas` (empty state).
- Sprint 3: admin + 3 edge functions + relatório final com percentual.

## Confirmação

Aprovando este plano executo **Sprint 1** agora (só migration + storage + tipos). Sprints 2 e 3 seguem em respostas subsequentes para manter cada entrega auditável e revertível. Se preferir, posso comprimir os 3 sprints em uma única execução — mas o risco de erro cresce muito e reverter fica difícil.
