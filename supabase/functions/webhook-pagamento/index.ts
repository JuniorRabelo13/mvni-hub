import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Webhook usually doesn't need CORS for the gateway to call it, but good to have
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const payload = await req.json()
    console.log('Webhook recebido:', payload)

    const event = payload.event
    const payment = payload.payment

    // No Asaas, externalReference é o nosso cobranca_id
    const cobranca_id = payment.externalReference

    if (!cobranca_id) {
      return new Response(JSON.stringify({ message: 'Sem externalReference' }), { status: 200 })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verificar se o evento é de pagamento confirmado
    if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
      const { error } = await supabase
        .from('cobrancas')
        .update({ 
          status: 'pago',
          pago_em: new Date().toISOString()
        })
        .eq('id', cobranca_id)
        .eq('status', 'pendente') // Segurança: só atualiza se estiver pendente

      if (error) {
        console.error('Erro ao atualizar cobrança:', error)
        throw error
      }

      console.log(`Cobrança ${cobranca_id} marcada como paga via webhook.`)
    }

    return new Response(JSON.stringify({ received: true }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 
    })

  } catch (error) {
    console.error('Erro no webhook:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
