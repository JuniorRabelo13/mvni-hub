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
      const leadPhone = item.leads?.telefone
      
      if (!leadPhone) continue;

      // 2. Global Anti-Spam Check (10 days rule)
      const { data: canSend } = await supabase.rpc('check_and_register_whatsapp_send', {
        target_phone: leadPhone
      });

      if (!canSend) {
        console.log(`Lead ${leadPhone} bloqueado pela regra global de 10 dias.`);
        await supabase.from('whatsapp_queue').update({ status: 'blocked_spam' }).eq('id', item.id);
        continue;
      }

      // 3. Check config
      const { data: config } = await supabase.from('whatsapp_config').select('*').eq('user_id', userId).single()
      if (!config) continue

      // 4. Check working hours
      const now = new Date()
      const currentTime = now.toLocaleTimeString('pt-BR', { hour12: false })
      if (currentTime < config.horario_inicio || currentTime > config.horario_fim) continue

      // 5. Find active and CONNECTED agent
      const { data: agent } = await supabase
        .from('whatsapp_agents')
        .select('*, whatsapp_number_stats(*)')
        .eq('user_id', userId)
        .eq('status', 'ativo')
        .eq('conectado', true) // Somente números conectados via QR
        .order('ultima_atividade', { ascending: true })
        .limit(1)
        .single()

      if (!agent) {
        console.log('Nenhum agente conectado disponível para usuário:', userId)
        continue
      }

      const stats = agent.whatsapp_number_stats?.[0]
      if (agent.mensagens_enviadas_hoje >= (stats?.daily_volume_limit || 40)) {
        console.log('Limite diário atingido para agente:', agent.id)
        continue
      }

      // 6. Process action
      if (item.payload.action === 'new_lead') {
        const welcomeMsg = `Olá, ${item.leads.nome}! Tudo bem?\nVi que você demonstrou interesse em nossos serviços. Como posso te ajudar hoje?`
        
        // In a real scenario, here we would call the WhatsApp API (Baileys/Instance)
        // For now, we record as "enviada"
        
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
          ultima_atividade: new Date().toISOString()
        }).eq('id', agent.id)

        await supabase.from('leads').update({
          status: 'abordado',
          ultimo_contato: new Date().toISOString()
        }).eq('id', item.lead_id)
      }

      // Mark as processed
      await supabase.from('whatsapp_queue').update({ status: 'processed' }).eq('id', item.id)
    }

    return new Response('Processed')
  } catch (error) {
    return new Response(error.message, { status: 500 })
  }
})
