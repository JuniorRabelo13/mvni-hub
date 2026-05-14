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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, leadId, message, userId } = await req.json()

    // 1. Get Config
    const { data: config } = await supabaseAdmin
      .from('whatsapp_config')
      .select('*')
      .eq('user_id', user.id) // Security: enforce user_id from token
      .single()

    if (!config) throw new Error('Configuração não encontrada')

    // 2. Check Working Hours
    const now = new Date()
    const currentTime = now.toLocaleTimeString('pt-BR', { hour12: false })
    
    const isWorkingHours = currentTime >= config.horario_inicio && currentTime <= config.horario_fim

    if (action === 'new_lead' && !isWorkingHours) {
      console.log('Fora do horário comercial. Ignorando início de conversa.')
      return new Response(JSON.stringify({ status: 'outside_hours' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // 3. Logic for incoming message
    if (action === 'incoming_message') {
      if (!isWorkingHours) {
        // Auto-reply for off-hours
        const offHoursMsg = "Oi! Aqui é um assistente virtual 🤖\nPosso te ajudar com todas as informações agora mesmo.\nSe preferir falar com um especialista humano, seguimos no horário comercial 😊"
        
        await supabaseAdmin.from('whatsapp_messages').insert({
          lead_id: leadId,
          mensagem: offHoursMsg,
          direcao: 'saida',
          status: 'enviada',
          ia_resposta: true
        })

        return new Response(JSON.stringify({ status: 'auto_replied_off_hours' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // 4. AI Decision Engine (OpenAI)
      // We would call OpenAI here to classify and generate response
      // For now, let's simulate a response based on keywords or simple AI logic
      
      const response = await generateAIResponse(message, config.prompt_ia)

      await supabaseAdmin.from('whatsapp_messages').insert({
        lead_id: leadId,
        mensagem: response,
        direcao: 'saida',
        status: 'enviada',
        ia_resposta: true
      })
      
      // Update lead status if needed
      await supabaseAdmin.from('leads').update({ status: 'abordado', ultimo_contato: new Date().toISOString() }).eq('id', leadId)

      return new Response(JSON.stringify({ status: 'responded', response }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})

async function generateAIResponse(userMessage: string, prompt: string) {
  // Simulating OpenAI call
  // In a real scenario: const completion = await openai.createChatCompletion(...)
  
  const msg = userMessage.toLowerCase()
  if (msg.includes('preço') || msg.includes('valor')) {
    return "O valor depende do plano que você escolher! Temos opções a partir de R$ 49/mês. Qual o seu volume médio de vendas?"
  }
  if (msg.includes('como funciona')) {
    return "É bem simples! O agente cuida de toda a abordagem inicial para você. Quer que eu te envie um vídeo demonstrativo?"
  }
  
  return "Entendi! Vou verificar essa informação para você agora mesmo. Alguma outra dúvida?"
}
