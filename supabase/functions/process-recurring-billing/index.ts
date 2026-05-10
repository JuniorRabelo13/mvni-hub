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

    console.log("Iniciando processamento de cobranças recorrentes e inadimplência...")

    const hoje = new Date().toISOString().slice(0, 10)

    // 1. Marcar clientes como inadimplentes se tiverem cobranças vencidas
    const { data: vencidas, error: vError } = await supabaseAdmin
      .from('cobrancas')
      .select('cliente_id')
      .eq('status', 'pendente')
      .lt('vencimento', hoje)

    if (vError) throw vError

    if (vencidas && vencidas.length > 0) {
      const idsInadimplentes = [...new Set(vencidas.map(v => v.cliente_id))]
      const { error: updError } = await supabaseAdmin
        .from('clientes')
        .update({ ativo: false }) // Desativa o cliente por inadimplência
        .in('id', idsInadimplentes)
      
      if (updError) console.error("Erro ao atualizar status de inadimplentes:", updError)
      else console.log(`${idsInadimplentes.length} clientes marcados como inadimplentes/inativos.`)
    }

    // 2. Buscar todos os clientes ativos (que não estão inadimplentes) para gerar novas cobranças
    const { data: clientes, error: cliError } = await supabaseAdmin
      .from('clientes')
      .select('id, user_id, ativo, linhas(id, status)')
      .eq('ativo', true)

    if (cliError) throw cliError

    let cobrancasGeradas = 0

    for (const cliente of clientes) {
      const linhasAtivas = cliente.linhas?.filter(l => l.status === 'ativa') || []
      
      for (const linha of linhasAtivas) {
        // Verificar se já existe uma cobrança futura para evitar duplicidade
        const { data: existente } = await supabaseAdmin
          .from('cobrancas')
          .select('id')
          .eq('cliente_id', cliente.id)
          .eq('linha_id', linha.id)
          .gte('vencimento', hoje)
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

          if (!insError) {
            cobrancasGeradas++
          } else {
            console.error(`Erro ao gerar cobrança para cliente ${cliente.id}:`, insError)
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        message: "Processamento concluído", 
        cobrancas_geradas: cobrancasGeradas,
        inadimplentes_processados: vencidas?.length || 0
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
