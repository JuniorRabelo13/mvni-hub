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
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const supaAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    )
    const jwt = authHeader.replace('Bearer ', '')
    const { data: claims, error: clErr } = await supaAuth.auth.getClaims(jwt)
    if (clErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const userId = claims.claims.sub

    const body = await req.json().catch(() => ({}))
    const { anuncio_id, dias, posicao } = body ?? {}
    if (!anuncio_id || !dias || !posicao) {
      return new Response(JSON.stringify({ error: 'anuncio_id, dias e posicao são obrigatórios' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Confirmar ownership do anúncio
    const { data: anuncio, error: anErr } = await supabase
      .from('anuncios')
      .select('id, criado_por, status')
      .eq('id', anuncio_id)
      .single()
    if (anErr || !anuncio) {
      return new Response(JSON.stringify({ error: 'Anúncio não encontrado' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    if (anuncio.criado_por !== userId) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Preço via SECURITY DEFINER (safe)
    const { data: precoData, error: precoErr } = await supabase.rpc('calcular_preco_anuncio' as any, { p_posicao: posicao, p_dias: dias })
    if (precoErr) throw precoErr
    const valorReais = Number(precoData ?? 0)
    if (valorReais <= 0) {
      return new Response(JSON.stringify({ error: 'Preço inválido' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const unitAmount = Math.round(valorReais * 100)

    const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeSecret) {
      return new Response(JSON.stringify({ error: 'STRIPE_SECRET_KEY não configurado' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const origin = req.headers.get('origin') ?? 'https://mvni.novainteligenciacomercial.com.br'

    const params = new URLSearchParams({
      mode: 'payment',
      'line_items[0][price_data][currency]': 'brl',
      'line_items[0][price_data][unit_amount]': String(unitAmount),
      'line_items[0][price_data][product_data][name]': `Anúncio MVNI • ${posicao} • ${dias} dias`,
      'line_items[0][quantity]': '1',
      'success_url': `${origin}/anuncios/meus?paid=1&anuncio_id=${anuncio_id}`,
      'cancel_url': `${origin}/anuncios/criar?canceled=1`,
      'metadata[tipo_cobranca]': 'anuncio',
      'metadata[anuncio_id]': anuncio_id,
      'metadata[user_id]': userId,
      'metadata[origem]': 'mvni_hub',
    })

    const resp = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecret}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    })
    const json = await resp.json()
    if (!resp.ok) {
      console.error('Stripe error:', json)
      return new Response(JSON.stringify({ error: 'Falha ao criar checkout', details: json }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ url: json.url, id: json.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (e) {
    console.error(e)
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
