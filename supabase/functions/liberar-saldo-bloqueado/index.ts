import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { requireCronOrAdmin } from "../_shared/auth.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  // SECURITY: only scheduler (shared secret) or admin may release balances
  const _authResp = await requireCronOrAdmin(req)
  if (_authResp) return new Response(_authResp.body, { status: _authResp.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log("Iniciando processo diário de liberação de saldo bloqueado...")

    // 1. Buscar transações pendentes com data de liberação atingida
    const { data: transacoes, error: fetchError } = await supabaseAdmin
      .from('transacoes_wallet')
      .select('id, wallet_id, valor')
      .eq('status', 'pendente')
      .lte('data_liberacao', new Date().toISOString())

    if (fetchError) throw fetchError

    if (!transacoes || transacoes.length === 0) {
      return new Response(JSON.stringify({ message: "Nenhum saldo pendente para liberar hoje." }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      })
    }

    let liberados = 0
    let totalValor = 0

    // 2. Processar cada liberação
    // Usamos um loop para garantir integridade, mas em larga escala o ideal seria uma RPC dedicada
    for (const tx of transacoes) {
      const { error: updateError } = await supabaseAdmin.rpc('liberar_transacao_wallet', {
        p_transacao_id: tx.id,
        p_wallet_id: tx.wallet_id,
        p_valor: tx.valor
      })

      if (!updateError) {
        liberados++
        totalValor += Number(tx.valor)
      } else {
        console.error(`Erro ao liberar transação ${tx.id}:`, updateError.message)
      }
    }

    return new Response(
      JSON.stringify({ 
        message: "Processamento concluído", 
        transacoes_liberadas: liberados,
        valor_total_liberado: totalValor
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
