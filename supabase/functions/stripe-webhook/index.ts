import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Registra erros do motor financeiro sem quebrar o webhook (Stripe deve receber 200)
async function logSoftError(supabase: any, source: string, ctx: Record<string, unknown>, err: unknown) {
  const message = err instanceof Error ? err.message : String(err)
  console.error(`[stripe-webhook][${source}] soft-error: ${message}`, ctx)
  try {
    await supabase.from('system_error_logs').insert({
      module: 'stripe-webhook',
      severity: 'high',
      error_code: source,
      message,
      context: ctx as any,
    })
  } catch (_) { /* engolir */ }
}

const mesRefFor = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

  if (!stripeSecretKey) {
    return new Response(JSON.stringify({ error: 'STRIPE_SECRET_KEY não configurada' }), { status: 500 })
  }
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET não configurada — rejeitando webhook')
    return new Response(JSON.stringify({ error: 'Webhook secret not configured' }), { status: 500 })
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2022-11-15',
    httpClient: Stripe.createFetchHttpClient(),
  })

  try {
    const signature = req.headers.get('Stripe-Signature')
    if (!signature) {
      return new Response(JSON.stringify({ error: 'Assinatura do Stripe ausente' }), { status: 400 })
    }

    const body = await req.text()
    let event
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)
    } catch (err) {
      console.error(`Falha na validação do webhook: ${(err as Error).message}`)
      return new Response(JSON.stringify({ error: `Webhook Error: ${(err as Error).message}` }), { status: 400 })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log(`Evento recebido: ${event.id} [${event.type}]`)

    // Idempotência
    const { data: existingEvent, error: checkError } = await supabase
      .from('processed_events')
      .select('id')
      .eq('event_id', event.id)
      .maybeSingle()
    if (checkError) throw checkError
    if (existingEvent) {
      return new Response(JSON.stringify({ received: true, duplicate: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
      })
    }
    const { error: registerError } = await supabase
      .from('processed_events')
      .insert({ event_id: event.id, source: 'stripe', metadata: { type: event.type } })
    if (registerError) throw registerError

    switch (event.type) {
      case 'checkout.session.completed': {
        const session: any = event.data.object
        const md = (session?.metadata ?? {}) as Record<string, string>

        // ── Fluxo Ads self-service ──
        if (md.tipo_cobranca === 'anuncio' && md.anuncio_id) {
          if (session.payment_status === 'paid') {
            const valor = typeof session.amount_total === 'number' ? session.amount_total / 100 : null
            const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : null
            const { error: adUpdErr } = await supabase
              .from('anuncios')
              .update({
                status: 'pendente_aprovacao',
                valor_pago: valor,
                stripe_payment_id: paymentIntentId,
              })
              .eq('id', md.anuncio_id)
              .eq('status', 'rascunho')
            if (adUpdErr) console.error('Erro ao atualizar anúncio pós-pagamento:', adUpdErr.message)
          }
          break
        }

        // ── Fluxo cadastro de representante ──
        if (md.tipo_cobranca !== 'cadastro_representante' || md.origem !== 'mvni_hub') {
          console.log('checkout.session.completed: metadata não reconhecida, ignorando')
          break
        }
        if (session.payment_status !== 'paid') break

        const userId = md.user_id
        if (!userId) break
        const sessionId: string = session.id
        const paymentIntentId: string | null = typeof session.payment_intent === 'string' ? session.payment_intent : null
        const valor = typeof session.amount_total === 'number' ? session.amount_total / 100 : null
        const moeda = (session.currency || 'brl') as string

        const { error: insertErr } = await supabase
          .from('pagamentos_cadastro_representante')
          .insert({
            user_id: userId, stripe_session_id: sessionId, stripe_payment_intent_id: paymentIntentId,
            valor, moeda, status: 'pago',
            metadata: { tipo_cobranca: md.tipo_cobranca, origem: md.origem },
          })
        if (insertErr && (insertErr as any).code !== '23505') throw insertErr

        // Cadastro pago — data de referência = dia atual (aniversário)
        const nowISO = new Date().toISOString()
        const { error: updErr } = await supabase
          .from('profiles')
          .update({ cadastro_pago_em: nowISO })
          .eq('id', userId)
          .is('cadastro_pago_em', null)
        if (updErr) throw updErr

        console.log(`Cadastro representante confirmado para user ${userId} (session ${sessionId})`)
        break
      }

      case 'checkout.session.async_payment_succeeded': {
        const session: any = event.data.object
        const md = (session?.metadata ?? {}) as Record<string, string>
        if (md.tipo_cobranca !== 'cadastro_representante' || md.origem !== 'mvni_hub') break
        const userId = md.user_id; if (!userId) break

        await supabase.from('pagamentos_cadastro_representante').upsert(
          {
            user_id: userId, stripe_session_id: session.id,
            stripe_payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : null,
            valor: typeof session.amount_total === 'number' ? session.amount_total / 100 : null,
            moeda: (session.currency || 'brl') as string, status: 'pago',
            metadata: { tipo_cobranca: md.tipo_cobranca, origem: md.origem, evento: 'async_payment_succeeded' },
          },
          { onConflict: 'stripe_session_id' },
        )
        await supabase.from('profiles')
          .update({ cadastro_pago_em: new Date().toISOString() })
          .eq('id', userId).is('cadastro_pago_em', null)
        break
      }

      case 'checkout.session.async_payment_failed': {
        const session: any = event.data.object
        const md = (session?.metadata ?? {}) as Record<string, string>
        if (md.tipo_cobranca !== 'cadastro_representante' || md.origem !== 'mvni_hub') break
        const userId = md.user_id; if (!userId) break

        const { data: existingPagamento } = await supabase
          .from('pagamentos_cadastro_representante')
          .select('id, status').eq('stripe_session_id', session.id).maybeSingle()
        if (!existingPagamento) {
          await supabase.from('pagamentos_cadastro_representante').insert({
            user_id: userId, stripe_session_id: session.id,
            valor: typeof session.amount_total === 'number' ? session.amount_total / 100 : null,
            moeda: (session.currency || 'brl') as string, status: 'falhou',
            metadata: { tipo_cobranca: md.tipo_cobranca, origem: md.origem, evento: 'async_payment_failed' },
          })
        }
        break
      }

      case 'invoice.paid': {
        const invoice: any = event.data.object
        const subscriptionId = invoice.subscription

        // 1. Marcar assinatura como ativa
        const { data: assinatura, error: errorAssinatura } = await supabase
          .from('assinaturas')
          .update({ status: 'ativo' })
          .eq('stripe_subscription_id', subscriptionId)
          .select('id, cliente_id')
          .single()
        if (errorAssinatura) throw errorAssinatura

        // 2. Registrar pagamento
        const { data: pagamentoRow, error: errorPagamento } = await supabase
          .from('pagamentos')
          .insert({
            assinatura_id: assinatura.id,
            cliente_id: assinatura.cliente_id,
            stripe_payment_id: invoice.payment_intent,
            valor: invoice.amount_paid / 100,
            status: 'pago',
            data_vencimento: new Date(invoice.created * 1000).toISOString().split('T')[0],
            data_pagamento: new Date().toISOString().split('T')[0],
          })
          .select('id').single()
        if (errorPagamento) throw errorPagamento

        // 3. Motor financeiro + ativação de linha (best-effort, não bloqueia webhook)
        try {
          // Descobrir se é o 1º pagamento pago desta assinatura
          const { count: pagosCount } = await supabase
            .from('pagamentos')
            .select('id', { count: 'exact', head: true })
            .eq('assinatura_id', assinatura.id)
            .eq('status', 'pago')

          const { data: cliente } = await supabase
            .from('clientes')
            .select('id, user_id, plano_id')
            .eq('id', assinatura.cliente_id)
            .single()

          const representante_id = cliente?.user_id
          const mes_referencia = mesRefFor(new Date())
          const isFirstPayment = (pagosCount ?? 0) <= 1

          if (!representante_id) throw new Error('cliente sem representante (user_id)')

          if (isFirstPayment) {
            // Mês 1: ativa a linha (aloca chip ou cria em em_ativacao) e lança ativação financeira
            let linha_id: string | null = null
            try {
              const { data: linhaRet, error: linhaErr } = await supabase.rpc(
                'ativar_linha_pos_pagamento' as any,
                {
                  p_cliente_id: cliente.id,
                  p_representante_id: representante_id,
                  p_operadora_id: null,
                  p_plano_id: cliente.plano_id ?? null,
                  p_tipo: 'esim',
                  p_ddd: null,
                }
              )
              if (linhaErr) throw linhaErr
              linha_id = typeof linhaRet === 'string' ? linhaRet : (linhaRet as any)?.linha_id ?? null
            } catch (e) {
              await logSoftError(supabase, 'ativar_linha_pos_pagamento', { cliente_id: cliente.id }, e)
            }

            try {
              const { error: rfErr } = await supabase.rpc(
                'registrar_ativacao_financeira' as any,
                {
                  p_cliente_id: cliente.id,
                  p_representante_id: representante_id,
                  p_operadora_id: null,
                  p_linha_id: linha_id,
                  p_mes_referencia: mes_referencia,
                }
              )
              if (rfErr) throw rfErr
            } catch (e) {
              await logSoftError(supabase, 'registrar_ativacao_financeira', { cliente_id: cliente.id, mes_referencia }, e)
            }
          } else {
            // Mês 2+: apenas recorrência financeira (nunca ativa linha de novo)
            try {
              const { data: linhaExistente } = await supabase
                .from('mvno_linhas')
                .select('id, operadora_id, plano_id')
                .eq('cliente_id', cliente.id)
                .limit(1)
                .maybeSingle()

              const { error: rrErr } = await supabase.rpc(
                'registrar_recorrencia_financeira' as any,
                {
                  p_cliente_id: cliente.id,
                  p_representante_id: representante_id,
                  p_operadora_id: linhaExistente?.operadora_id ?? null,
                  p_linha_id: linhaExistente?.id ?? null,
                  p_mes_referencia: mes_referencia,
                }
              )
              if (rrErr) throw rrErr
            } catch (e) {
              await logSoftError(supabase, 'registrar_recorrencia_financeira', { cliente_id: cliente.id, mes_referencia }, e)
            }
          }

          // 4. Notificar cliente do pagamento confirmado (best-effort)
          try {
            await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/enviar-notificacao-vencimento`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
                'Content-Type': 'application/json',
                'X-Cron-Secret': Deno.env.get('CRON_SECRET') ?? '',
              },
              body: JSON.stringify({
                cliente_id: cliente.id,
                tipo: 'pagamento_confirmado',
                data_vencimento: new Date().toLocaleDateString('pt-BR'),
                valor: invoice.amount_paid / 100,
                fatura_id: pagamentoRow?.id,
              }),
            })
          } catch (e) {
            await logSoftError(supabase, 'notify_pagamento_confirmado', { cliente_id: cliente.id }, e)
          }
        } catch (e) {
          await logSoftError(supabase, 'motor_financeiro', { assinatura_id: assinatura.id }, e)
        }

        break
      }

      case 'invoice.payment_failed': {
        const invoice: any = event.data.object
        const subscriptionId = invoice.subscription
        const { data: assinatura, error: errorAssinatura } = await supabase
          .from('assinaturas').update({ status: 'inadimplente' })
          .eq('stripe_subscription_id', subscriptionId)
          .select('id, cliente_id').single()
        if (errorAssinatura) throw errorAssinatura

        const { error: errorPagamento } = await supabase.from('pagamentos').insert({
          assinatura_id: assinatura.id,
          cliente_id: assinatura.cliente_id,
          stripe_payment_id: invoice.payment_intent,
          valor: invoice.amount_due / 100,
          status: 'falhou',
          data_vencimento: new Date(invoice.created * 1000).toISOString().split('T')[0],
        })
        if (errorPagamento) throw errorPagamento
        break
      }

      case 'customer.subscription.deleted': {
        const subscription: any = event.data.object
        const { data: assinatura, error: errorAssinatura } = await supabase
          .from('assinaturas').update({ status: 'cancelado' })
          .eq('stripe_subscription_id', subscription.id)
          .select('cliente_id').single()
        if (errorAssinatura) throw errorAssinatura
        await supabase.from('clientes').update({ status: 'cancelado' }).eq('id', assinatura.cliente_id)
        break
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200,
    })
  } catch (error) {
    console.error('Erro na function stripe-webhook:', error)
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400,
    })
  }
})
