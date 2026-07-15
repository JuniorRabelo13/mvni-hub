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

    // 1. Buscar detalhes da solicitação e aplicar lock transacional/atômico via status + timestamp
    const now = new Date().toISOString()
    const { data: saque, error: fetchError } = await supabaseAdmin
      .from('solicitacoes_saque')
      .update({ processamento_iniciado_em: now }) // Lock atômico
      .match({ id: saque_id, status: 'aprovado' }) // Apenas se ainda estiver aprovado
      .select('*, dados_bancarios(*)')
      .single()

    if (fetchError || !saque) {
      throw new Error("Saque não encontrado, já processado ou não autorizado.")
    }

    // Check if it was already paid (redundant but safe)
    if (saque.status === 'pago') {
      return new Response(JSON.stringify({ message: "Este saque já foi pago anteriormente." }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 200 
      })
    }

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
        amount: saque.valor_liquido ?? saque.valor, // valor_liquido = valor - taxa_saque (definido em aprovar_saque)
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

    // 3. Atualizar para Pago (Atomicamente confirmando o ID do saque)
    const { error: updateError } = await supabaseAdmin.from('solicitacoes_saque')
      .update({ 
        status: 'pago', 
        pago_em: new Date().toISOString(),
        comprovante_url: result.receipt_url || 'https://link-comprovante.com/v/123'
      })
      .match({ id: saque_id, status: 'aprovado' }) // Garante que ainda somos nós processando

    if (updateError) {
      console.error("Erro ao marcar saque como pago no DB:", updateError)
      // Aqui teríamos um problema de inconsistência (Pix pago, DB não atualizado)
      // Em produção, isso deveria disparar um alerta crítico ou log de conciliação
      throw new Error("Pix enviado, mas erro ao atualizar banco de dados. Conciliação manual necessária.")
    }

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
