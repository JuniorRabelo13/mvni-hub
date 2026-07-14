# PIX para Faturas MVNO — Confirmação automática via webhook

Aproveitar a integração **Stripe já ativa** no projeto (`STRIPE_SECRET_KEY` + `stripe-webhook`) sem alterar nenhum módulo existente. Todo o fluxo PIX vive em novos arquivos com prefixo `mvno-pix-*`.

## Fluxo do usuário

1. Cliente abre `/cliente/pagamentos` (ou detalhe da fatura) → botão **Pagar com PIX** aparece em faturas `aberta` ou `atrasada`.
2. Modal exibe QR Code + Copia-e-Cola + valor + expiração (30 min).
3. Ao confirmar o PIX no banco, o webhook Stripe recebe `payment_intent.succeeded` → marca `mvno_pagamentos.status = confirmado` e `mvno_faturas.status = paga` com `pago_em = now()`.
4. UI faz *polling* leve (a cada 5s) enquanto o modal está aberto; ao confirmar, toast de sucesso e recibo aparece no histórico.
5. Aba **Pagos** de `/cliente/pagamentos` mostra o recibo (linha, competência, valor, `pago_em`, ID da transação) com botão **Baixar recibo** (HTML imprimível via `window.print`).

## Mudanças de banco (1 migration)

Nova tabela `mvno_pagamentos`:
- `fatura_id` (FK → `mvno_faturas`)
- `cliente_id`, `linha_id` (denormalizados para RLS + histórico)
- `provider` = `stripe_pix`
- `provider_intent_id` (payment_intent id)
- `valor`, `status` (`pendente` | `confirmado` | `expirado` | `cancelado`)
- `pix_qr_code_base64`, `pix_copia_e_cola`, `expires_at`, `paid_at`, `metadata`

RLS:
- Cliente lê seus próprios pagamentos (`cliente_id ∈ clientes.user_id`)
- `service_role` faz insert/update (usado pelas edge functions)
- Admin/master lê tudo via `has_role`

Grants padrão em `authenticated` e `service_role`. **Nenhuma tabela existente é alterada.**

## Novas Edge Functions (2)

- `mvno-pix-criar`: valida sessão do cliente, checa ownership da fatura, chama `stripe.paymentIntents.create({ amount, currency: 'brl', payment_method_types: ['pix'] })`, confirma com `payment_method_data: { type: 'pix' }`, extrai `next_action.pix_display_qr_code`, insere linha em `mvno_pagamentos`, retorna QR + copia-e-cola.
- `mvno-pix-webhook`: assinado com `STRIPE_WEBHOOK_SECRET` **dedicado do MVNO** (separado do webhook existente para não colidir). Trata `payment_intent.succeeded` e `payment_intent.payment_failed`. Idempotente via `provider_intent_id`.

Se o `STRIPE_WEBHOOK_SECRET_MVNO` ainda não existir, peço via `add_secret` num passo separado (o usuário cadastra o endpoint da nova função no dashboard Stripe e cola o secret).

## Frontend (todos novos, exceto integração pontual)

- `src/services/mvno/pagamentosService.ts` — `criarPix(faturaId)`, `getPagamentoByFatura(faturaId)`.
- `src/hooks/mvno/usePagamentos.ts` — React Query com polling condicional (5s enquanto `status = pendente`).
- `src/components/mvno/PixCheckoutDialog.tsx` — QR (img base64) + botão "Copiar código" + contador de expiração + estado ao vivo.
- `src/components/mvno/ReciboPix.tsx` — layout imprimível do recibo (competência, linha, valor, tx id, data de confirmação).
- `src/pages/cliente/Pagamentos.tsx` — adicionar botão **Pagar com PIX** nas abas "Pendentes"/"Atrasados" e **Ver recibo** em "Pagos". Sem remover nada do existente.
- `src/pages/cliente/MinhasFaturas.tsx` e `FaturaDetalhes.tsx` — adicionar o mesmo botão em faturas abertas.

## Segurança

- Ownership da fatura re-checado no `mvno-pix-criar` via `userClient` (RLS já bloqueia terceiros).
- Webhook usa `serviceRoleClient` apenas para gravar status.
- Valor sempre lido do banco (`mvno_faturas.valor`), nunca do body.
- Idempotência por `provider_intent_id` (constraint UNIQUE).

## Não altero

Stripe existente, `stripe-webhook`, `stripe-*`, `assinaturas`, `pagamentos` (tabela do fluxo de assinatura de representante), motor de comissão, `AuthGuard`, RLS existente, parser MVNO, upload center, edge functions atuais, tabelas MVNO já criadas.

## Requisitos externos (usuário precisa fazer 1 vez)

1. Ativar **PIX** como método de pagamento na conta Stripe (dashboard Stripe → Payment methods → PIX).
2. Após deploy da função `mvno-pix-webhook`, cadastrar o endpoint dela no Stripe (Webhooks → Add endpoint → eventos `payment_intent.succeeded` e `payment_intent.payment_failed`) e colar o signing secret quando eu pedir via `add_secret` como `STRIPE_WEBHOOK_SECRET_MVNO`.

## Entrega em ordem

1. Migration `mvno_pagamentos` (aguarda aprovação).
2. Edge functions `mvno-pix-criar` + `mvno-pix-webhook`.
3. Pedir `STRIPE_WEBHOOK_SECRET_MVNO`.
4. Serviços, hooks, componentes e integração nas páginas.
5. Validação: TypeScript, RLS, ownership, botões visíveis somente nas faturas em aberto.

Posso executar?