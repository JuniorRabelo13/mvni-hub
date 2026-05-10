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

    console.log("Iniciando processamento de cobranças recorrentes...")

    // 1. Buscar todos os clientes ativos
    const { data: clientes, error: cliError } = await supabaseAdmin
      .from('clientes')
      .select('id, user_id, ativo, linhas(id, status)')
      .eq('ativo', true)

    if (cliError) throw cliError

    let cobrancasGeradas = 0
    const hoje = new Date().toISOString().slice(0, 10)

    for (const cliente of clientes) {
      // Para cada linha ativa do cliente
      const linhasAtivas = cliente.linhas?.filter(l => l.status === 'ativa') || []
      
      for (const linha of linhasAtivas) {
        // Verificar se já existe uma cobrança pendente para este mês
        // Lógica simplificada: ver se existe cobrança com vencimento nos próximos 30 dias
        const { data: existente } = await supabaseAdmin
          .from('cobrancas')
          .select('id')
          .eq('cliente_id', cliente.id)
          .eq('linha_id', linha.id)
          .gte('vencimento', hoje)
          .limit(1)

        if (!existente || existente.length === 0) {
          // Gerar nova cobrança
          const vencimento = new Date()
          vencimento.setMonth(vencimento.getMonth() + 1)
          
          const { error: insError } = await supabaseAdmin
            .from('cobrancas')
            .insert({
              user_id: cliente.user_id,
              cliente_id: cliente.id,
              linha_id: linha.id,
              valor: 99.90, // Valor padrão do plano
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
        cobrancas_geradas: cobrancasGeradas 
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
