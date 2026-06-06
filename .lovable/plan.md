## Objetivo
Criar a Edge Function `stripe-checkout-cadastro-representante` que gera uma Stripe Checkout Session em modo `payment` (pagamento único) usando o Price ID guardado no secret `STRIPE_PRICE_CADASTRO_REPRESENTANTE`, exigindo usuário autenticado e retornando apenas a URL de checkout.

## Pré-requisitos / Secrets
- `STRIPE_SECRET_KEY` — já existe ✅
- `STRIPE_PRICE_CADASTRO_REPRESENTANTE` — **NÃO existe ainda**. Será solicitado via `add_secret` antes de finalizar (a função tolera ausência retornando 500 controlado, mas só funcionará após o secret).
- `STRIPE_WEBHOOK_SECRET` — já validado pelo webhook existente. Webhook NÃO será alterado neste passo (apenas relato).

## Arquivos
**Criar:**
- `supabase/functions/stripe-checkout-cadastro-representante/index.ts`

**Não alterar:**
- `stripe-webhook/index.ts` (sem mudanças — apenas relatar que `checkout.session.completed` ainda não é tratado lá; ativação do representante via webhook fica para etapa futura, fora do escopo).
- `cadastrar-representante/index.ts`, `stripe-criar-assinatura/index.ts`, `stripe-criar-cliente/index.ts`, motor de comissão, chips, clientes, assinaturas — intocados.
- `supabase/config.toml` — não precisa de bloco novo (verify_jwt já é false por padrão Lovable; validação JWT é feita em código).

**Frontend:** não há tela/botão claro de "ativar cadastro pagando R$ 99,90" hoje (`Cadastro.tsx` apenas cria a conta e redireciona para `/cadastro/sucesso`). Conforme o prompt, **não criarei tela nova**. Apenas relatarei o ponto de integração recomendado.

## Comportamento da função

```text
POST /functions/v1/stripe-checkout-cadastro-representante
Authorization: Bearer <jwt do usuário logado>
Body: {} (ignorado — nada é lido do frontend)
```

Fluxo:
1. CORS + OPTIONS handler.
2. `requireUser(req)` do helper compartilhado `_shared/auth.ts` → 401 se não houver JWT válido.
3. Ler secrets `STRIPE_SECRET_KEY` e `STRIPE_PRICE_CADASTRO_REPRESENTANTE`. Se faltar qualquer um → 500 genérico (sem expor valores).
4. Resolver `origin` a partir do header `Origin` (fallback para um valor seguro), montar:
   - `success_url = ${origin}/cadastro/sucesso?session_id={CHECKOUT_SESSION_ID}`
   - `cancel_url = ${origin}/cadastro?canceled=1`
5. (Opcional, sem duplicar customer) tentar localizar `stripe_customer_id` já existente para o usuário em `assinaturas` via service role; se houver, passar `customer`. Caso contrário, passar `customer_email` (sem criar customer manualmente — Stripe cria 1 no checkout). **Não chama** `stripe-criar-cliente`.
6. Criar Checkout Session via REST Stripe:
   - `mode=payment`
   - `line_items[0][price]=<STRIPE_PRICE_CADASTRO_REPRESENTANTE>`
   - `line_items[0][quantity]=1`
   - `payment_method_types[]=card`
   - `metadata[user_id]=<sub do JWT>`
   - `metadata[tipo_cobranca]=cadastro_representante`
   - `metadata[origem]=mvni_hub`
   - `payment_intent_data[metadata][user_id]`, `[tipo_cobranca]`, `[origem]` (mesmos valores — facilita reconciliação futura sem alterar webhook agora)
   - `success_url`, `cancel_url`
   - Moeda BRL vem do próprio Price cadastrado no Stripe (não enviada pelo frontend).
7. Retornar `{ url: session.url }` com 200. Em erro: log genérico `console.error("checkout error", err.message)` (sem stack com segredos) e `{ error: "Falha ao criar checkout" }` com 500.

## Garantias de segurança
- ❌ Não lê `price_id`, `amount`, `currency`, `user_id`, `customer_id` do body.
- ✅ `user_id` vem exclusivamente do JWT (`requireUser`).
- ✅ `mode=payment` (jamais `subscription`).
- ✅ Nenhuma escrita em `assinaturas`, `clientes`, `usuarios`, `chips`, `comissoes`.
- ✅ Nenhuma ativação de representante, kit, ou comissão nesta etapa.
- ✅ `STRIPE_SECRET_KEY` nunca sai do servidor nem é logada.

## Webhook (apenas relato, sem alterar)
O webhook atual trata `invoice.paid`, `invoice.payment_failed`, `customer.subscription.deleted` — todos focados em **assinatura mensal de cliente final**. Para o evento `checkout.session.completed` com `metadata.tipo_cobranca='cadastro_representante'` será necessário um handler dedicado em etapa futura. Como o prompt proíbe "mexer muito no webhook", **não tocarei nele agora** e listarei como risco/risco-restante.

## Integração frontend (não implementar agora)
Ponto recomendado para etapa futura: novo botão "Pagar R$ 99,90 e ativar cadastro" em `/cadastro/sucesso` (`src/pages/CadastroSucesso.tsx`) chamando:
```ts
const { data } = await supabase.functions.invoke('stripe-checkout-cadastro-representante');
window.location.href = data.url;
```
Sem criar UI nova nesta tarefa.

## Validação
- Build / TypeScript limpos.
- Função compila no Deno (imports `npm:stripe` ou fetch REST — usarei REST para casar com o estilo das outras funções).
- Sem alteração em regra financeira, comissão, clientes, assinaturas, chips, motor de payout.

## Risco restante
1. Webhook ainda não consome `checkout.session.completed` → pagamento será cobrado mas a ativação do representante exigirá etapa futura (fora do escopo deste prompt).
2. Secret `STRIPE_PRICE_CADASTRO_REPRESENTANTE` precisa ser criado pelo usuário (será solicitado).
3. Sem tela de pagamento, função fica disponível mas não invocada até integração futura.

## Passos
1. Solicitar secret `STRIPE_PRICE_CADASTRO_REPRESENTANTE` via `add_secret`.
2. Criar `supabase/functions/stripe-checkout-cadastro-representante/index.ts` conforme spec acima.
3. Entregar relatório final.
