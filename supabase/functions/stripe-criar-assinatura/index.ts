import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { cliente_id, stripe_customer_id, valor, dia_vencimento } = await req.json()
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')

    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY não configurada')
    }

    // 1. Criar Price no Stripe
    const priceResponse = await fetch('https://api.stripe.com/v1/prices', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'unit_amount': valor.toString(),
        'currency': 'brl',
        'recurring[interval]': 'month',
        'product_data[name]': 'Assinatura MVNI',
      }),
    })

    const priceData = await priceResponse.json()
    if (!priceResponse.ok) throw new Error(`Erro ao criar preço no Stripe: ${JSON.stringify(priceData)}`)

    // Calcular billing_cycle_anchor (próximo dia_vencimento)
    const now = new Date()
    let anchorDate = new Date(now.getFullYear(), now.getMonth(), dia_vencimento)
    
    // Se o dia já passou ou é hoje, vai para o próximo mês
    if (anchorDate <= now) {
      anchorDate.setMonth(anchorDate.getMonth() + 1)
    }
    
    // Se o dia não existir no mês (ex: 31 de abril), o JS ajusta automaticamente para o próximo mês. 
    // Para garantir o comportamento do Stripe, poderíamos fazer mais validações, 
    // mas o padrão solicitado é simples.
    const billingCycleAnchor = Math.floor(anchorDate.getTime() / 1000)

    // 2. Criar Subscription no Stripe
    const subscriptionResponse = await fetch('https://api.stripe.com/v1/subscriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'customer': stripe_customer_id,
        'items[0][price]': priceData.id,
        'billing_cycle_anchor': billingCycleAnchor.toString(),
        'proration_behavior': 'none',
      }),
    })

    const subscriptionData = await subscriptionResponse.json()
    if (!subscriptionResponse.ok) throw new Error(`Erro ao criar assinatura no Stripe: ${JSON.stringify(subscriptionData)}`)

    // Conectar ao Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 3. Atualizar tabela assinaturas
    const { error: errorAssinatura } = await supabase
      .from('assinaturas')
      .update({
        stripe_subscription_id: subscriptionData.id,
        status: 'ativo',
        valor: valor / 100, // Salva o valor em reais na tabela (numeric)
        data_proxima_cobranca: anchorDate.toISOString().split('T')[0],
        stripe_customer_id: stripe_customer_id
      })
      .eq('cliente_id', cliente_id)

    if (errorAssinatura) throw errorAssinatura

    // 4. Atualizar status do cliente na tabela clientes
    const { error: errorCliente } = await supabase
      .from('clientes')
      .update({ status: 'ativo' })
      .eq('id', cliente_id)

    if (errorCliente) throw errorCliente

    // 5. Retornar sucesso
    return new Response(JSON.stringify({ success: true, subscriptionId: subscriptionData.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Erro na function stripe-criar-assinatura:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
