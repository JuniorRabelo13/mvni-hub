import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const WHATSAPP_API_URL = Deno.env.get('WHATSAPP_API_URL')
    const WHATSAPP_API_KEY = Deno.env.get('WHATSAPP_API_KEY')

    if (!WHATSAPP_API_URL || !WHATSAPP_API_KEY) {
      throw new Error("Configurações de WhatsApp (URL/KEY) ausentes nas variáveis de ambiente.")
    }

    // 1. Calcular data alvo (3 dias no futuro)
    const hoje = new Date()
    const alvo = new Date()
    alvo.setDate(hoje.getDate() + 3)
    const diaAlvo = alvo.getDate()
    const mesReferencia = new Date(alvo.getFullYear(), alvo.getMonth(), 1).toISOString().slice(0, 10)

    console.log(`Buscando clientes com vencimento no dia ${diaAlvo} para o mês ${mesReferencia}...`)

    // 2. Buscar clientes ativos com esse dia de vencimento (incluindo valor do plano)
    const { data: clientes, error: cliError } = await supabaseAdmin
      .from('clientes')
      .select('id, nome, telefone, plano_id, planos(nome, valor)')
      .eq('ativo', true)
      .filter('dia_vencimento', 'eq', diaAlvo) // Assumindo coluna dia_vencimento (int)

    if (cliError) throw cliError

    let sucessos = 0
    let falhas = 0
    let jaEnviados = 0

    for (const cliente of clientes) {
      // 3. Verificar idempotência (se já enviou este mês)
      const { data: jaNotificado } = await supabaseAdmin
        .from('notificacoes_enviadas')
        .select('id')
        .eq('cliente_id', cliente.id)
        .eq('tipo', 'vencimento_3_dias')
        .eq('referencia_mes', mesReferencia)
        .maybeSingle()

      if (jaNotificado) {
        jaEnviados++
        continue
      }

      const valorPlano = (cliente.planos as any)?.valor || 99.90
      const telefoneLimpo = cliente.telefone?.replace(/\D/g, '')
      
      if (!telefoneLimpo) {
        falhas++
        continue
      }

      const mensagem = `Olá ${cliente.nome}! Seu plano vence em 3 dias (dia ${diaAlvo}). Valor: R$${valorPlano.toFixed(2).replace('.', ',')}. Pague em dia e mantenha seu serviço ativo. 👍`

      try {
        // 4. Enviar via Evolution API (Exemplo de payload padrão)
        const response = await fetch(`${WHATSAPP_API_URL}/message/sendText/LOVABLE_SaaS`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': WHATSAPP_API_KEY
          },
          body: JSON.stringify({
            number: telefoneLimpo,
            text: mensagem
          })
        })

        if (!response.ok) throw new Error(await response.text())

        // 5. Registrar Sucesso
        await supabaseAdmin.from('notificacoes_enviadas').insert({
          cliente_id: cliente.id,
          tipo: 'vencimento_3_dias',
          referencia_mes: mesReferencia,
          status: 'sucesso'
        })
        sucessos++

      } catch (err) {
        console.error(`Erro ao notificar ${cliente.nome}:`, err.message)
        await supabaseAdmin.from('notificacoes_enviadas').insert({
          cliente_id: cliente.id,
          tipo: 'vencimento_3_dias',
          referencia_mes: mesReferencia,
          status: 'erro',
          detalhes: err.message
        })
        falhas++
      }
    }

    return new Response(
      JSON.stringify({ 
        total_clientes_alvo: clientes.length, 
        sucessos, 
        falhas, 
        ja_enviados_anteriormente: jaEnviados 
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
