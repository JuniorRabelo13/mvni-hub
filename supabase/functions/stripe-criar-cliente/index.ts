import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { requireRole } from "../_shared/auth.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // SECURITY: admin/master only
  const _auth = await requireRole(req, ["admin", "master_admin"])
  if (_auth.response) return new Response(_auth.response.body, { status: _auth.response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  try {
    const { cliente_id, nome, email, telefone } = await req.json()
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')

    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY não configurada')
    }

    // 1. Chamar a API do Stripe para criar o cliente
    const stripeResponse = await fetch('https://api.stripe.com/v1/customers', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'name': nome,
        'email': email,
        'phone': telefone || '',
      }),
    })

    const customerData = await stripeResponse.json()
    if (!stripeResponse.ok) {
      throw new Error(`Erro ao criar cliente no Stripe: ${JSON.stringify(customerData)}`)
    }

    // 2. Receber o customer.id retornado pelo Stripe
    const stripe_customer_id = customerData.id

    // Conectar ao Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 3. Salvar o stripe_customer_id na tabela assinaturas como um novo registro com status "pendente"
    const { error: errorAssinatura } = await supabase
      .from('assinaturas')
      .insert({
        cliente_id: cliente_id,
        stripe_customer_id: stripe_customer_id,
        status: 'pendente'
      })

    if (errorAssinatura) throw errorAssinatura

    // 4. Retornar o stripe_customer_id para o frontend
    return new Response(JSON.stringify({ stripe_customer_id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Erro na function stripe-criar-cliente:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
