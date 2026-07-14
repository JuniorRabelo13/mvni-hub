# PIX via Pagar.me — MVNI HUB

Cobranças PIX de faturas MVNO usam **exclusivamente a API do Pagar.me** (v5).
O Stripe permanece **apenas** para assinaturas, cartão de crédito, checkout do
representante e cobranças recorrentes — nenhum fluxo Stripe foi alterado.

## Fluxo

1. Cliente clica **Pagar com PIX** em `/cliente/pagamentos`.
2. Frontend chama a Edge Function `mvno-pagarme-pix-criar` com `fatura_id`.
3. A função:
   - autentica o usuário (JWT),
   - valida ownership da fatura via RLS,
   - reaproveita PIX pendente ainda válido, se houver,
   - cria uma `order` PIX no Pagar.me (`POST /core/v5/orders`),
   - persiste `mvno_pagamentos` (gateway = `pagarme`) com `qr_code`,
     `qr_code_url`, `expires_at`, `gateway_transaction_id` e `payload`,
   - marca a fatura como `processando`.
4. Modal exibe QR Code + Copia-e-Cola + contador; faz polling a cada 5 s.
5. Ao pagar, o Pagar.me chama `mvno-pagarme-webhook`, que:
   - valida assinatura HMAC-SHA256 usando `PAGARME_WEBHOOK_SECRET`,
   - checa idempotência em `processed_events`,
   - atualiza `mvno_pagamentos.status = confirmado` + `paid_at`,
   - atualiza `mvno_faturas.status = paga` + `pago_em`,
   - registra auditoria em `mvno_audit_logs`.
6. UI recebe `confirmado` no próximo poll, toast de sucesso e recibo disponível.

## Variáveis de ambiente (Edge Functions)

| Nome | Uso |
|------|-----|
| `PAGARME_API_KEY`         | Secret key da conta Pagar.me (`sk_...`). Autentica via Basic Auth (`user:${key}` com senha vazia). |
| `PAGARME_ENCRYPTION_KEY`  | Public/encryption key (`ek_...`). Reservada para tokenização futura. |
| `PAGARME_WEBHOOK_SECRET`  | Segredo compartilhado usado para validar `x-hub-signature`. |
| `PAGARME_BASE_URL`        | Opcional. Padrão `https://api.pagar.me/core/v5`. |

Nenhuma chave Pagar.me é exposta no bundle do frontend.

## Webhook

Endpoint público:
`https://<PROJECT_REF>.functions.supabase.co/mvno-pagarme-webhook`

Registrar no painel Pagar.me → **Webhooks** com os eventos:

- `charge.paid`
- `charge.payment_failed`
- `charge.canceled`
- (opcional) `order.paid`, `order.canceled`

Colar o segredo usado no header `x-hub-signature` como `PAGARME_WEBHOOK_SECRET`.

## Banco

Tabela `mvno_pagamentos` recebeu apenas colunas novas — nada foi removido:

- `gateway` (`pagarme` | `stripe_pix` legacy)
- `gateway_transaction_id`
- `gateway_status`
- `pix_qrcode` (URL do QR Code)
- `pix_copia_cola` (BR code Copia-e-Cola)
- `payload` (JSON bruto do gateway/evento)
- `processed_at`

Índice: `idx_mvno_pagamentos_gateway_tx (gateway_transaction_id)`.

## Testes em sandbox

1. Use a chave `sk_test_...` do Pagar.me em `PAGARME_API_KEY`.
2. Gere um PIX pela UI. O Pagar.me devolve QR/Copia-e-Cola de teste.
3. Simule o pagamento na sandbox do Pagar.me (painel → Cobranças → **Confirmar
   PIX**) ou via chamada `POST /charges/:id/pay`.
4. O webhook deve chegar em `mvno-pagarme-webhook`; confira em
   Backend → Edge Functions → Logs. `mvno_pagamentos.status` vira `confirmado`
   e a fatura vira `paga` automaticamente.

## Escopo Stripe (inalterado)

Stripe continua ativo em: `stripe-webhook`, `stripe-criar-assinatura`,
`stripe-cancelar-assinatura`, `stripe-criar-cliente`,
`stripe-checkout-cadastro-representante`. Nenhum código, secret ou tabela
Stripe foi modificado nesta migração.
