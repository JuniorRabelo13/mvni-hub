import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { requireUser } from "../_shared/auth.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TIPOS_VALIDOS = new Set(['esim', 'fisico'])
const VALOR_OFICIAL_CENTAVOS = 9990 // R$ 99,90 — mesmo valor oficial usado em stripe-criar-assinatura

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const _auth = await requireUser(req)
  if (!_auth.user) return new Response(_auth.response!.body, { status: _auth.response!.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  const userId = _auth.user.id

  try {
    const { cliente_id, operadora_id, tipo, ddd } = await req.json()

    if (!cliente_id || !operadora_id || !tipo || !ddd) {
      return new Response(JSON.stringify({ error: 'cliente_id, operadora_id, tipo e ddd são obrigatórios' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    if (!TIPOS_VALIDOS.has(tipo)) {
      return new Response(JSON.stringify({ error: "tipo deve ser 'esim' ou 'fisico'" }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    if (!/^\d{2}$/.test(String(ddd))) {
      return new Response(JSON.stringify({ error: 'ddd deve ter 2 dígitos' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeSecretKey) throw new Error('STRIPE_SECRET_KEY não configurada')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Confirmar ownership do cliente
    const { data: cliente, error: clienteErr } = await supabase
      .from('clientes')
      .select('id, nome, email, telefone, user_id')
      .eq('id', cliente_id)
      .single()
    if (clienteErr || !cliente) {
      return new Response(JSON.stringify({ error: 'Cliente não encontrado' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    if (cliente.user_id !== userId) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // 2. Confirmar que a operadora existe e está ativa
    const { data: operadora, error: operadoraErr } = await supabase
      .from('operadoras')
      .select('id')
      .eq('id', operadora_id)
      .eq('ativo', true)
      .maybeSingle()
    if (operadoraErr || !operadora) {
      return new Response(JSON.stringify({ error: 'Operadora inválida ou inativa' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // 3. Reaproveitar ou criar o Stripe Customer (mesmo padrão de stripe-criar-cliente)
    const { data: assinaturaExistente } = await supabase
      .from('assinaturas')
      .select('id, stripe_customer_id')
      .eq('cliente_id', cliente_id)
      .not('stripe_customer_id', 'is', null)
      .limit(1)
      .maybeSingle()

    let stripeCustomerId = assinaturaExistente?.stripe_customer_id ?? null

    if (!stripeCustomerId) {
      const customerResponse = await fetch('https://api.stripe.com/v1/customers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${stripeSecretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'name': cliente.nome,
          'email': cliente.email || '',
          'phone': cliente.telefone || '',
        }),
      })
      const customerData = await customerResponse.json()
      if (!customerResponse.ok) throw new Error(`Erro ao criar cliente no Stripe: ${JSON.stringify(customerData)}`)
      stripeCustomerId = customerData.id

      const { error: errorAssinatura } = await supabase
        .from('assinaturas')
        .insert({ cliente_id, stripe_customer_id: stripeCustomerId, status: 'pendente' })
      if (errorAssinatura) throw errorAssinatura
    }

    // 4. Criar Checkout Session (pagamento único do 1º mês)
    const origin = req.headers.get('origin') || req.headers.get('referer')?.replace(/\/+$/, '') || 'https://app.mvni.hub'
    const success_url = `${origin}/painel?venda=sucesso&cliente_id=${cliente_id}`
    const cancel_url = `${origin}/painel?venda=cancelada`

    const params = new URLSearchParams()
    params.set('mode', 'payment')
    params.set('customer', stripeCustomerId)
    params.set('line_items[0][price_data][currency]', 'brl')
    params.set('line_items[0][price_data][unit_amount]', VALOR_OFICIAL_CENTAVOS.toString())
    params.set('line_items[0][price_data][product_data][name]', 'Assinatura MVNI Hub - Plano Premium (1ª mensalidade)')
    params.set('line_items[0][quantity]', '1')
    params.set('success_url', success_url)
    params.set('cancel_url', cancel_url)
    params.set('metadata[tipo_cobranca]', 'primeira_mensalidade_cliente')
    params.set('metadata[origem]', 'mvni_hub')
    params.set('metadata[cliente_id]', cliente_id)
    params.set('metadata[operadora_id]', operadora_id)
    params.set('metadata[tipo]', tipo)
    params.set('metadata[ddd]', String(ddd))
    params.set('metadata[user_id]', userId)

    const sessionResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    })
    const sessionData = await sessionResponse.json()
    if (!sessionResponse.ok) throw new Error(`Erro ao criar checkout no Stripe: ${JSON.stringify(sessionData)}`)

    return new Response(JSON.stringify({ url: sessionData.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Erro na function stripe-checkout-nova-venda:', error)
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
