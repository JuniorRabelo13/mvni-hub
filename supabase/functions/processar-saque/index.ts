import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Role check: Only admin or master can process payouts
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin' && profile?.role !== 'master') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { saque_id } = await req.json()
    if (!saque_id) throw new Error("ID do saque não informado.")

    console.log(`Processando saque via Pix: ${saque_id}...`)

    // 1. Buscar detalhes da solicitação
    const { data: saque, error: fetchError } = await supabaseAdmin
      .from('solicitacoes_saque')
      .select('*, dados_bancarios(*)')
      .eq('id', saque_id)
      .single()

    if (fetchError || !saque) throw new Error("Saque não encontrado.")
    if (saque.status !== 'aprovado') throw new Error("Apenas saques aprovados podem ser processados.")

    // 2. Chamar API de Pix (Exemplo fictício)
    const PIX_API_URL = Deno.env.get('PIX_API_URL')
    const PIX_API_KEY = Deno.env.get('PIX_API_KEY')

    if (!PIX_API_URL) throw new Error("Configuração de API Pix ausente.")

    const response = await fetch(`${PIX_API_URL}/v1/transfer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PIX_API_KEY}`
      },
      body: JSON.stringify({
        key: saque.dados_bancarios.chave_pix,
        key_type: saque.dados_bancarios.tipo_chave,
        amount: saque.valor,
        description: `Saque LOVABLE SaaS - #${saque.id.slice(0,8)}`
      })
    })

    const result = await response.json()

    if (!response.ok) {
      console.error("Erro na API Pix:", result)
      await supabaseAdmin.from('solicitacoes_saque')
        .update({ status: 'rejeitado', motivo_rejeicao: `Erro API Pix: ${result.message}` })
        .eq('id', saque_id)
      throw new Error(`Erro no processamento do Pix: ${result.message}`)
    }

    // 3. Atualizar para Pago
    await supabaseAdmin.from('solicitacoes_saque')
      .update({ 
        status: 'pago', 
        pago_em: new Date().toISOString(),
        comprovante_url: result.receipt_url || 'https://link-comprovante.com/v/123'
      })
      .eq('id', saque_id)

    return new Response(
      JSON.stringify({ message: "Saque processado com sucesso!", receipt: result.receipt_url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
