import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

  if (!stripeSecretKey) {
    return new Response(JSON.stringify({ error: 'STRIPE_SECRET_KEY não configurada' }), { status: 500 })
  }

  // SECURITY: webhook secret is REQUIRED. Never accept unverified events.
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

    // 0. Idempotency check: check if event was already processed
    const { data: existingEvent, error: checkError } = await supabase
      .from('processed_events')
      .select('id')
      .eq('event_id', event.id)
      .maybeSingle()

    if (checkError) {
      console.error(`Erro ao verificar idempotência: ${checkError.message}`)
      throw checkError
    }

    if (existingEvent) {
      console.log(`Evento ${event.id} já processado anteriormente.`)
      return new Response(JSON.stringify({ received: true, duplicate: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // Register event as being processed
    const { error: registerError } = await supabase
      .from('processed_events')
      .insert({
        event_id: event.id,
        source: 'stripe',
        metadata: { type: event.type }
      })

    if (registerError) {
      console.error(`Erro ao registrar evento no processed_events: ${registerError.message}`)
      throw registerError
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session: any = event.data.object
        const md = (session?.metadata ?? {}) as Record<string, string>

        // Only handle representante cadastro flow — ignore other checkouts safely
        if (
          md.tipo_cobranca !== 'cadastro_representante' ||
          md.origem !== 'mvni_hub'
        ) {
          console.log('checkout.session.completed: metadata não corresponde a cadastro_representante, ignorando')
          break
        }

        // SECURITY: never activate unless Stripe confirms paid
        if (session.payment_status !== 'paid') {
          console.log(`checkout.session.completed recebido com payment_status=${session.payment_status}, não ativando`)
          break
        }

        const userId = md.user_id
        if (!userId || typeof userId !== 'string') {
          console.error('checkout.session.completed: metadata.user_id ausente')
          break
        }

        const sessionId: string = session.id
        const paymentIntentId: string | null =
          typeof session.payment_intent === 'string' ? session.payment_intent : null
        const valor =
          typeof session.amount_total === 'number' ? session.amount_total / 100 : null
        const moeda = (session.currency || 'brl') as string

        // Idempotência: tenta inserir; se já existe (unique stripe_session_id), apenas mantém
        const { error: insertErr } = await supabase
          .from('pagamentos_cadastro_representante')
          .insert({
            user_id: userId,
            stripe_session_id: sessionId,
            stripe_payment_intent_id: paymentIntentId,
            valor,
            moeda,
            status: 'pago',
            metadata: {
              tipo_cobranca: md.tipo_cobranca,
              origem: md.origem,
            },
          })

        if (insertErr && (insertErr as any).code !== '23505') {
          // 23505 = unique_violation → já processado, ok
          console.error('Erro ao registrar pagamento cadastro representante:', insertErr.message)
          throw insertErr
        }

        // Marca representante como cadastro pago (idempotente — set apenas se nulo)
        const { error: updErr } = await supabase
          .from('profiles')
          .update({ cadastro_pago_em: new Date().toISOString() })
          .eq('id', userId)
          .is('cadastro_pago_em', null)

        if (updErr) {
          console.error('Erro ao marcar cadastro_pago_em em profiles:', updErr.message)
          throw updErr
        }

        console.log(`Cadastro representante confirmado para user ${userId} (session ${sessionId})`)
        break
      }

      // ETAPA 3: Pagamento assíncrono — sucesso
      case 'checkout.session.async_payment_succeeded': {
        const session: any = event.data.object
        const md = (session?.metadata ?? {}) as Record<string, string>

        if (
          md.tipo_cobranca !== 'cadastro_representante' ||
          md.origem !== 'mvni_hub'
        ) {
          console.log('checkout.session.async_payment_succeeded: metadata não corresponde a cadastro_representante, ignorando')
          break
        }

        const userId = md.user_id
        if (!userId || typeof userId !== 'string') {
          console.error('checkout.session.async_payment_succeeded: metadata.user_id ausente')
          break
        }

        const sessionId: string = session.id
        const paymentIntentId: string | null =
          typeof session.payment_intent === 'string' ? session.payment_intent : null
        const valor =
          typeof session.amount_total === 'number' ? session.amount_total / 100 : null
        const moeda = (session.currency || 'brl') as string

        // Upsert: registrar ou atualizar como 'pago' (idempotente via stripe_session_id)
        const { error: asyncInsertErr } = await supabase
          .from('pagamentos_cadastro_representante')
          .upsert(
            {
              user_id: userId,
              stripe_session_id: sessionId,
              stripe_payment_intent_id: paymentIntentId,
              valor,
              moeda,
              status: 'pago',
              metadata: {
                tipo_cobranca: md.tipo_cobranca,
                origem: md.origem,
                evento: 'async_payment_succeeded',
              },
            },
            { onConflict: 'stripe_session_id' }
          )

        if (asyncInsertErr) {
          console.error('Erro ao registrar pagamento assíncrono:', asyncInsertErr.message)
          throw asyncInsertErr
        }

        // Ativar representante apenas se ainda não foi ativado
        const { error: asyncUpdErr } = await supabase
          .from('usuarios')
          .update({ cadastro_pago_em: new Date().toISOString() })
          .eq('id', userId)
          .is('cadastro_pago_em', null)

        if (asyncUpdErr) {
          console.error('Erro ao marcar cadastro_pago_em (async):', asyncUpdErr.message)
          throw asyncUpdErr
        }

        console.log(`Pagamento assíncrono confirmado para user ${userId} (session ${sessionId})`)
        break
      }

      // ETAPA 3: Pagamento assíncrono — falha
      case 'checkout.session.async_payment_failed': {
        const session: any = event.data.object
        const md = (session?.metadata ?? {}) as Record<string, string>

        if (
          md.tipo_cobranca !== 'cadastro_representante' ||
          md.origem !== 'mvni_hub'
        ) {
          console.log('checkout.session.async_payment_failed: metadata não corresponde a cadastro_representante, ignorando')
          break
        }

        const userId = md.user_id
        if (!userId || typeof userId !== 'string') {
          console.error('checkout.session.async_payment_failed: metadata.user_id ausente')
          break
        }

        const sessionId: string = session.id

        // Inserir falha apenas se ainda não existir registro para esta sessão
        const { data: existingPagamento } = await supabase
          .from('pagamentos_cadastro_representante')
          .select('id, status')
          .eq('stripe_session_id', sessionId)
          .maybeSingle()

        if (!existingPagamento) {
          const { error: failInsertErr } = await supabase
            .from('pagamentos_cadastro_representante')
            .insert({
              user_id: userId,
              stripe_session_id: sessionId,
              valor: typeof session.amount_total === 'number' ? session.amount_total / 100 : null,
              moeda: (session.currency || 'brl') as string,
              status: 'falhou',
              metadata: {
                tipo_cobranca: md.tipo_cobranca,
                origem: md.origem,
                evento: 'async_payment_failed',
              },
            })

          if (failInsertErr && (failInsertErr as any).code !== '23505') {
            console.error('Erro ao registrar falha de pagamento assíncrono:', failInsertErr.message)
            throw failInsertErr
          }
        } else {
          console.log(`Pagamento assíncrono: falha registrada, sessão ${sessionId} já existente com status ${existingPagamento.status}`)
        }

        // NÃO ativar representante em caso de falha
        console.log(`Pagamento assíncrono falhou para user ${userId} (session ${sessionId})`)
        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object
        const subscriptionId = invoice.subscription

        // 1. Atualizar status da assinatura para "ativo"
        const { data: assinatura, error: errorAssinatura } = await supabase
          .from('assinaturas')
          .update({ status: 'ativo' })
          .eq('stripe_subscription_id', subscriptionId)
          .select('id', 'cliente_id')
          .single()

        if (errorAssinatura) throw errorAssinatura

        // 2. Inserir registro na tabela pagamentos
        const { error: errorPagamento } = await supabase
          .from('pagamentos')
          .insert({
            assinatura_id: assinatura.id,
            cliente_id: assinatura.cliente_id,
            stripe_payment_id: invoice.payment_intent,
            valor: invoice.amount_paid / 100,
            status: 'pago',
            data_vencimento: new Date(invoice.created * 1000).toISOString().split('T')[0],
            data_pagamento: new Date().toISOString().split('T')[0]
          })

        if (errorPagamento) throw errorPagamento
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object
        const subscriptionId = invoice.subscription

        // 1. Atualizar status da assinatura para "inadimplente"
        const { data: assinatura, error: errorAssinatura } = await supabase
          .from('assinaturas')
          .update({ status: 'inadimplente' })
          .eq('stripe_subscription_id', subscriptionId)
          .select('id', 'cliente_id')
          .single()

        if (errorAssinatura) throw errorAssinatura

        // 2. Inserir registro na tabela pagamentos com status "falhou"
        const { error: errorPagamento } = await supabase
          .from('pagamentos')
          .insert({
            assinatura_id: assinatura.id,
            cliente_id: assinatura.cliente_id,
            stripe_payment_id: invoice.payment_intent,
            valor: invoice.amount_due / 100,
            status: 'falhou',
            data_vencimento: new Date(invoice.created * 1000).toISOString().split('T')[0]
          })

        if (errorPagamento) throw errorPagamento
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        const subscriptionId = subscription.id

        // 1. Atualizar status da assinatura para "cancelado"
        const { data: assinatura, error: errorAssinatura } = await supabase
          .from('assinaturas')
          .update({ status: 'cancelado' })
          .eq('stripe_subscription_id', subscriptionId)
          .select('cliente_id')
          .single()

        if (errorAssinatura) throw errorAssinatura

        // 2. Atualizar status do cliente para "cancelado" na tabela clientes
        const { error: errorCliente } = await supabase
          .from('clientes')
          .update({ status: 'cancelado' })
          .eq('id', assinatura.cliente_id)

        if (errorCliente) throw errorCliente
        break
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Erro na function stripe-webhook:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
