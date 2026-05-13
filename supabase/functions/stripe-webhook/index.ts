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

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2022-11-15',
    httpClient: Stripe.createFetchHttpClient(),
  })

  try {
    const signature = req.headers.get('Stripe-Signature')
    if (!signature && webhookSecret) {
      throw new Error('Assinatura do Stripe ausente')
    }

    const body = await req.text()
    let event

    if (webhookSecret && signature) {
      try {
        event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)
      } catch (err) {
        console.error(`Falha na validação do webhook: ${err.message}`)
        return new Response(JSON.stringify({ error: `Webhook Error: ${err.message}` }), { status: 400 })
      }
    } else {
      event = JSON.parse(body)
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log(`Evento recebido: ${event.type}`)

    switch (event.type) {
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
