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

  const startTime = Date.now()

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body = await req.json()
    const { 
      action, // 'message_in', 'automation_trigger'
      lead_id, 
      cliente_id, 
      whatsapp_instance_id, 
      message,
      force_agent_code
    } = body

    // 1. Context Assembly (Intelligent)
    let contextData: any = {}
    let contextStr = ""
    let clientName = "Contato"

    if (cliente_id) {
      const { data: cliente } = await supabaseAdmin.from('clientes').select(`
        *,
        linhas(msisdn, status, plano, ativada_em),
        pagamentos(id, status, valor, data_vencimento)
      `).eq('id', cliente_id).single()
      
      if (cliente) {
        contextData = cliente
        clientName = cliente.nome
        const activeLines = cliente.linhas?.filter((l: any) => l.status === 'active') || []
        const pendingPayments = cliente.pagamentos?.filter((p: any) => p.status === 'pending') || []
        contextStr = `
        CLIENTE: ${cliente.nome}
        LINHAS ATIVAS: ${activeLines.map((l: any) => `${l.msisdn} (${l.plano})`).join(', ')}
        FINANCEIRO: ${pendingPayments.length > 0 ? `Inadimplente (${pendingPayments.length} faturas)` : 'Em dia'}
        VALOR TOTAL PENDENTE: ${pendingPayments.reduce((acc: number, p: any) => acc + (p.valor || 0), 0)}
        `
      }
    } else if (lead_id) {
      const { data: lead } = await supabaseAdmin.from('leads').select('*').eq('id', lead_id).single()
      if (lead) {
        contextData = lead
        clientName = lead.nome
        contextStr = `LEAD: ${lead.nome}. STATUS ATUAL: ${lead.status}.`
      }
    }

    // 2. Memory Retrieval (Contextual History)
    const { data: memory } = await supabaseAdmin
      .from('ai_memory')
      .select('key, value, importance_score')
      .or(`cliente_id.eq.${cliente_id},lead_id.eq.${lead_id}`)
      .order('importance_score', { ascending: false })
    
    const memoryStr = memory?.map(m => `- ${m.key}: ${m.value}`).join('\n') || "Sem memórias registradas."

    // 3. RAG - Search for knowledge (Simulated/Ready for Vector Search)
    // Here we could use: const { data: knowledge } = await supabaseAdmin.rpc('match_context', { query_embedding: ... })
    const knowledgeStr = "MVNI Hub é a maior plataforma de Telecom SaaS do Brasil. Oferecemos planos pré-pagos e controle com gestão via dashboard."

    // 4. Intelligent Routing
    let agentCode = force_agent_code
    if (!agentCode) {
      // Automatic decision based on context
      if (contextData?.pagamentos?.some((p: any) => p.status === 'pending')) {
        agentCode = 'agent_debt'
      } else if (cliente_id && contextData?.linhas?.length === 0) {
        agentCode = 'agent_onboarding'
      } else if (cliente_id) {
        agentCode = 'agent_support'
      } else {
        agentCode = 'agent_sdr'
      }
    }

    const { data: agent } = await supabaseAdmin.from('ai_agent_settings').select('*').eq('code', agentCode).single()
    if (!agent) throw new Error(`Agente ${agentCode} não configurado.`)

    // 5. Conversation History
    let conversationId: string
    const { data: conv } = await supabaseAdmin
      .from('ai_conversations')
      .select('id')
      .or(`cliente_id.eq.${cliente_id},lead_id.eq.${lead_id}`)
      .eq('status', 'active')
      .maybeSingle()

    if (conv) {
      conversationId = conv.id
    } else {
      const { data: newConv } = await supabaseAdmin
        .from('ai_conversations')
        .insert({ cliente_id, lead_id, whatsapp_instance_id })
        .select().single()
      conversationId = newConv.id
    }

    const { data: history } = await supabaseAdmin
      .from('ai_messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(8)
    
    const historyMsgs = history?.reverse() || []

    // 6. OpenAI Enterprise Call (GPT-4o)
    const openAiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openAiKey) throw new Error("API Key da OpenAI não encontrada nos segredos.")

    const systemPrompt = `
${agent.base_prompt}

# CONTEXTO DO CONTATO
Nome: ${clientName}
${contextStr}

# MEMÓRIA PERSISTENTE
${memoryStr}

# BASE DE CONHECIMENTO (RAG)
${knowledgeStr}

# REGRAS ENTERPRISE
- Use delays humanos.
- Nunca repita a mesma frase duas vezes.
- Se identificar interesse de compra, use o tom SDR.
- Se houver inadimplência, foque na regularização.
- Mantenha a resposta curta (max 3 parágrafos).
    `

    const messages = [
      { role: "system", content: systemPrompt },
      ...historyMsgs,
      { role: "user", content: message }
    ]

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openAiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages,
        temperature: agent.temperature,
        max_tokens: agent.max_tokens,
        user: conversationId
      })
    })

    if (!openaiRes.ok) throw new Error(`Erro na OpenAI: ${await openaiRes.text()}`)
    const aiData = await openaiRes.json()
    const aiText = aiData.choices[0].message.content
    const usage = aiData.usage

    // 7. Lead Scoring Logic
    if (lead_id) {
      const scoringAnalysis = await analyzeLeadScore(aiText, message)
      await updateLeadScore(supabaseAdmin, lead_id, scoringAnalysis)
    }

    // 8. Persistence & Observability
    await supabaseAdmin.from('ai_messages').insert([
      { conversation_id: conversationId, role: 'user', content: message },
      { conversation_id: conversationId, role: 'assistant', content: aiText, agent_id: agent.id }
    ])

    await supabaseAdmin.from('ai_token_usage').insert({
      conversation_id: conversationId,
      model: 'gpt-4o',
      prompt_tokens: usage.prompt_tokens,
      completion_tokens: usage.completion_tokens,
      total_tokens: usage.total_tokens,
      estimated_cost: (usage.prompt_tokens * 0.000005) + (usage.completion_tokens * 0.000015)
    })

    const executionTime = Date.now() - startTime
    await supabaseAdmin.from('ai_automation_logs').insert({
      conversation_id: conversationId,
      action: 'generate_ai_response',
      status: 'success',
      execution_time_ms: executionTime,
      metadata: { agent: agentCode, tokens: usage.total_tokens }
    })

    // 9. Return Response with Human Delays
    const typingDelay = Math.min(6000, aiText.length * 40) // 40ms per char

    return new Response(JSON.stringify({
      success: true,
      response: aiText,
      delay_ms: typingDelay,
      agent: agentCode,
      metrics: {
        tokens: usage.total_tokens,
        time: executionTime
      }
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})

async function analyzeLeadScore(aiText: string, userMessage: string) {
  // Simple heuristic for demo, could be another AI call
  let score = 5
  const keywords = ['quero', 'comprar', 'preço', 'valor', 'plano', 'contratar']
  keywords.forEach(k => {
    if (userMessage.toLowerCase().includes(k)) score += 15
  })
  return score
}

async function updateLeadScore(supabase: any, leadId: string, value: number) {
  const { data } = await supabase.from('ai_lead_scores').select('score_value').eq('lead_id', leadId).single()
  const newScore = Math.min(100, (data?.score_value || 0) + value)
  let classification = 'cold'
  if (newScore > 70) classification = 'hot'
  else if (newScore > 30) classification = 'warm'

  await supabase.from('ai_lead_scores').upsert({
    lead_id: leadId,
    score_value: newScore,
    classification,
    last_update: new Date().toISOString()
  })
}