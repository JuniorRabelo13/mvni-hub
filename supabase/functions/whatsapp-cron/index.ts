import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    // 1. Get pending queue items
    const { data: queue } = await supabase
      .from('whatsapp_queue')
      .select('*, leads(*)')
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .limit(10)

    if (!queue || queue.length === 0) return new Response('No pending items')

    for (const item of queue) {
      const { userId } = item.payload
      
      // 2. Check config
      const { data: config } = await supabase.from('whatsapp_config').select('*').eq('user_id', userId).single()
      if (!config) continue

      // 3. Check working hours
      const now = new Date()
      const currentTime = now.toLocaleTimeString('pt-BR', { hour12: false })
      if (currentTime < config.horario_inicio || currentTime > config.horario_fim) continue

      // 4. Find active agent
      const { data: agent } = await supabase
        .from('whatsapp_agents')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'ativo')
        .lt('mensagens_enviadas_hoje', 'limite_diario')
        .order('ultima_mensagem_em', { ascending: true })
        .limit(1)
        .single()

      if (!agent) {
        console.log('Nenhum agente disponível ou limite atingido para usuário:', userId)
        continue
      }

      // 5. Process action
      if (item.payload.action === 'new_lead') {
        const welcomeMsg = `Olá, ${item.leads.nome}! Tudo bem?\nVi que você demonstrou interesse em nossos serviços. Como posso te ajudar hoje?`
        
        // Record message
        await supabase.from('whatsapp_messages').insert({
          lead_id: item.lead_id,
          agente_id: agent.id,
          mensagem: welcomeMsg,
          direcao: 'saida',
          status: 'enviada'
        })

        // Update stats
        await supabase.from('whatsapp_agents').update({
          mensagens_enviadas_hoje: agent.mensagens_enviadas_hoje + 1,
          ultima_mensagem_em: new Date().toISOString()
        }).eq('id', agent.id)

        await supabase.from('leads').update({
          status: 'abordado',
          ultimo_contato: new Date().toISOString()
        }).eq('id', item.lead_id)
      }

      // Mark as processed
      await supabase.from('whatsapp_queue').update({ status: 'processed' }).eq('id', item.id)
      
      // Artificial human delay for next one in same user? 
      // Actually the cron runs every minute, so we process few items per run.
    }

    return new Response('Processed')
  } catch (error) {
    return new Response(error.message, { status: 500 })
  }
})
