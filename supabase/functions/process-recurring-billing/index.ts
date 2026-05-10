import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log("Iniciando processamento de cobranças recorrentes, inadimplência e suspensão...")

    const hoje = new Date()
    const hojeStr = hoje.toISOString().slice(0, 10)
    
    // Configuração de dias de carência para suspensão automática da linha
    const DIAS_CARENCIA_SUSPENSAO = 5 
    const dataLimiteSuspensao = new Date()
    dataLimiteSuspensao.setDate(hoje.getDate() - DIAS_CARENCIA_SUSPENSAO)
    const dataLimiteSuspensaoStr = dataLimiteSuspensao.toISOString().slice(0, 10)

    // 1. Marcar clientes como inadimplentes e SUSPENDER LINHAS se tiverem cobranças vencidas
    const { data: vencidas, error: vError } = await supabaseAdmin
      .from('cobrancas')
      .select('cliente_id, linha_id, vencimento')
      .eq('status', 'pendente')
      .lt('vencimento', hojeStr)

    if (vError) throw vError

    let inadimplentesTotal = 0
    if (vencidas && vencidas.length > 0) {
      const idsClientesInadimplentes = [...new Set(vencidas.map(v => v.cliente_id))]
      inadimplentesTotal = idsClientesInadimplentes.length
      
      // Atualizar status do cliente para inativo/inadimplente
      await supabaseAdmin
        .from('clientes')
        .update({ ativo: false })
        .in('id', idsClientesInadimplentes)

      // Identificar linhas para suspensão automática (vencidas há mais de X dias)
      const idsLinhasParaSuspender = vencidas
        .filter(v => v.vencimento <= dataLimiteSuspensaoStr)
        .map(v => v.linha_id)

      if (idsLinhasParaSuspender.length > 0) {
        await supabaseAdmin
          .from('linhas')
          .update({ 
            status: 'suspensa',
            deactivated_at: hoje.toISOString()
          })
          .in('id', idsLinhasParaSuspender)
        
        console.log(`${idsLinhasParaSuspender.length} linhas suspensas automaticamente.`)
      }
    }

    // 2. Buscar todos os clientes ativos para gerar novas cobranças recorrentes
    const { data: clientes, error: cliError } = await supabaseAdmin
      .from('clientes')
      .select('id, user_id, ativo, linhas(id, status)')
      .eq('ativo', true)

    if (cliError) throw cliError

    let cobrancasGeradas = 0

    for (const cliente of clientes) {
      const linhasAtivas = cliente.linhas?.filter(l => l.status === 'ativa') || []
      
      for (const linha of linhasAtivas) {
        const { data: existente } = await supabaseAdmin
          .from('cobrancas')
          .select('id')
          .eq('cliente_id', cliente.id)
          .eq('linha_id', linha.id)
          .gte('vencimento', hojeStr)
          .limit(1)

        if (!existente || existente.length === 0) {
          const vencimento = new Date()
          vencimento.setMonth(vencimento.getMonth() + 1)
          
          const { error: insError } = await supabaseAdmin
            .from('cobrancas')
            .insert({
              user_id: cliente.user_id,
              cliente_id: cliente.id,
              linha_id: linha.id,
              valor: 99.90,
              vencimento: vencimento.toISOString().slice(0, 10),
              status: 'pendente',
              is_primeira: false
            })

          if (!insError) cobrancasGeradas++
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        message: "Processamento concluído", 
        cobrancas_geradas: cobrancasGeradas,
        inadimplentes_processados: inadimplentesTotal
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error("Erro na Edge Function:", error.message)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})
