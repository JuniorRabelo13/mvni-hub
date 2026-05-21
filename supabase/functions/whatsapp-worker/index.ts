import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const startTime = Date.now()
    
    // 1. Buscar instâncias conectadas e saudáveis para balanceamento
    const { data: instances, error: instError } = await supabase
      .from('whatsapp_instances')
      .select('id, status, health_score')
      .eq('status', 'connected')
      .order('health_score', { ascending: false })

    if (instError) throw instError
    if (!instances || instances.length === 0) {
      return new Response(JSON.stringify({ message: "Nenhuma instância conectada disponível" }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      })
    }

    // 2. Consumir fila (Mensagens Pendentes ou Agendadas)
    const { data: queueItems, error: queueError } = await supabase
      .from('whatsapp_message_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .order('prioridade', { ascending: false })
      .order('scheduled_at', { ascending: true })
      .limit(10) // Lote de 10 por rodada

    if (queueError) throw queueError

    const results = []

    for (const item of queueItems) {
      // 3. Distribuição de carga: Selecionar instância (Round Robin simples ou Health-based)
      // Aqui usamos a primeira instância disponível do lote (que já vem ordenada por score)
      const instance = instances[Math.floor(Math.random() * instances.length)]

      // 4. Marcar como processando para evitar duplicidade
      await supabase.from('whatsapp_message_queue').update({ 
        status: 'processing', 
        instance_id: instance.id 
      }).eq('id', item.id)

      // 5. Simular Anti-ban (Delay Humano e Simulação de Digitação)
      const typingDelay = Math.floor(Math.random() * 2000) + 1000 // 1-3s
      await new Promise(resolve => setTimeout(resolve, typingDelay))

      // 6. Tentar Envio (Placeholder para Provider Real)
      // Simulação de taxa de sucesso/falha baseada em escala real
      const isSuccess = Math.random() > 0.05 // 95% sucesso simulado
      
      const executionTime = Date.now() - startTime

      if (isSuccess) {
        await supabase.from('whatsapp_message_queue').update({
          status: 'sent',
          processed_at: new Date().toISOString()
        }).eq('id', item.id)

        await supabase.from('whatsapp_message_logs').insert({
          queue_id: item.id,
          instance_id: instance.id,
          action: 'send_message',
          status: 'success',
          execution_time_ms: executionTime,
          provider_response: { message: "Simulated success", provider: instance.provider }
        })

        // Atualizar Métricas
        await supabase.rpc('increment_whatsapp_metrics', { 
          p_instance_id: instance.id, 
          p_success: true 
        })

      } else {
        const nextRetry = item.retries + 1
        const shouldRetry = nextRetry < item.max_retries
        
        await supabase.from('whatsapp_message_queue').update({
          status: shouldRetry ? 'pending' : 'failed',
          retries: nextRetry,
          error_message: 'Simulated provider error/timeout',
          scheduled_at: shouldRetry ? new Date(Date.now() + (Math.pow(2, nextRetry) * 1000)).toISOString() : item.scheduled_at
        }).eq('id', item.id)

        await supabase.from('whatsapp_message_logs').insert({
          queue_id: item.id,
          instance_id: instance.id,
          action: 'send_message',
          status: 'failed',
          execution_time_ms: executionTime,
          provider_response: { error: "Simulated failure", provider: instance.provider }
        })

        await supabase.rpc('increment_whatsapp_metrics', { 
          p_instance_id: instance.id, 
          p_success: false 
        })
      }

      results.push({ id: item.id, success: isSuccess })
    }

    return new Response(JSON.stringify({ 
      processed: results.length, 
      results,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Worker Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
