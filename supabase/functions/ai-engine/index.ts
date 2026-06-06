import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { requireUser } from "../_shared/auth.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // SECURITY: require authenticated user
  const _auth = await requireUser(req)
  if (_auth.response) return new Response(_auth.response.body, { status: _auth.response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  const startTime = Date.now()

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body = await req.json()
    const { 
      action, 
      lead_id, 
      cliente_id, 
      whatsapp_instance_id, 
      message,
      force_agent_code
    } = body

    const openAiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openAiKey) throw new Error("API Key da OpenAI não encontrada.")

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
        VALOR TOTAL PENDENTE: R$ ${pendingPayments.reduce((acc: number, p: any) => acc + (p.valor || 0), 0)}
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

    // 2. Memory Retrieval
    const { data: memory } = await supabaseAdmin
      .from('ai_memory')
      .select('key, value, importance_score')
      .or(`cliente_id.eq.${cliente_id},lead_id.eq.${lead_id}`)
      .order('importance_score', { ascending: false })
    
    const memoryStr = memory?.map(m => `- ${m.key}: ${m.value}`).join('\n') || "Sem memórias registradas."

    // 3. RAG - Real Semantic Search
    let knowledgeStr = "MVNI Hub: Telecom SaaS Enterprise."
    try {
      const embRes = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: { "Authorization": `Bearer ${openAiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "text-embedding-3-small", input: message })
      })
      if (embRes.ok) {
        const { data: [{ embedding }] } = await embRes.json()
        const { data: matches } = await supabaseAdmin.rpc('match_ai_context', {
          query_embedding: embedding,
          match_threshold: 0.5,
          match_count: 3
        })
        if (matches && matches.length > 0) {
          knowledgeStr = matches.map((m: any) => m.content).join('\n---\n')
        }
      }
    } catch (e) {
      console.warn("RAG Search failed, continuing with default knowledge.", e)
    }

    // 4. Intelligent Routing
    let agentCode = force_agent_code
    if (!agentCode) {
      if (contextData?.pagamentos?.some((p: any) => p.status === 'pending')) {
        agentCode = 'agent_debt'
      } else if (cliente_id && (contextData?.linhas?.length || 0) === 0) {
        agentCode = 'agent_onboarding'
      } else if (cliente_id) {
        agentCode = 'agent_support'
      } else {
        agentCode = 'agent_sdr'
      }
    }

    const { data: agent } = await supabaseAdmin.from('ai_agent_settings').select('*').eq('code', agentCode).single()
    if (!agent) throw new Error(`Agente ${agentCode} não configurado.`)

    // 5. History
    let conversationId: string
    const { data: conv } = await supabaseAdmin.from('ai_conversations')
      .select('id').or(`cliente_id.eq.${cliente_id},lead_id.eq.${lead_id}`)
      .eq('status', 'active').maybeSingle()

    if (conv) {
      conversationId = conv.id
    } else {
      const { data: nConv } = await supabaseAdmin.from('ai_conversations')
        .insert({ cliente_id, lead_id, whatsapp_instance_id }).select().single()
      conversationId = nConv.id
    }

    const { data: history } = await supabaseAdmin.from('ai_messages').select('role, content')
      .eq('conversation_id', conversationId).order('created_at', { ascending: false }).limit(6)
    const historyMsgs = (history || []).reverse()

    // 6. OpenAI Call
    const systemPrompt = `
${agent.base_prompt}

# CONTEXTO DO CONTATO
Nome: ${clientName}
${contextStr}

# MEMÓRIA PERSISTENTE
${memoryStr}

# CONHECIMENTO ESPECÍFICO (RAG)
${knowledgeStr}

# REGRAS OPERACIONAIS
- Use tom profissional e amigável.
- Nunca alucine informações. Se não souber, peça para aguardar um atendente humano.
- Respostas em Português do Brasil.
- Max 250 caracteres por mensagem.
    `

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${openAiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: agent.model || "gpt-4o",
        messages: [{ role: "system", content: systemPrompt }, ...historyMsgs, { role: "user", content: message }],
        temperature: agent.temperature,
        max_tokens: agent.max_tokens,
        user: conversationId
      })
    })

    if (!openaiRes.ok) throw new Error(`OpenAI Error: ${await openaiRes.text()}`)
    const aiData = await openaiRes.json()
    const aiText = aiData.choices[0].message.content
    const usage = aiData.usage

    // 7. Lead Scoring & Logs
    if (lead_id) {
      const scoreInc = aiText.toLowerCase().includes('agend') ? 25 : (message.length > 20 ? 5 : 2)
      await supabaseAdmin.rpc('increment_lead_score', { p_lead_id: lead_id, p_inc: scoreInc })
    }

    await supabaseAdmin.from('ai_messages').insert([
      { conversation_id: conversationId, role: 'user', content: message },
      { conversation_id: conversationId, role: 'assistant', content: aiText, agent_id: agent.id }
    ])

    await supabaseAdmin.from('ai_token_usage').insert({
      conversation_id: conversationId,
      model: agent.model,
      prompt_tokens: usage.prompt_tokens,
      completion_tokens: usage.completion_tokens,
      total_tokens: usage.total_tokens,
      estimated_cost: (usage.prompt_tokens * 0.000005) + (usage.completion_tokens * 0.000015)
    })

    const executionTime = Date.now() - startTime
    await supabaseAdmin.from('ai_automation_logs').insert({
      conversation_id: conversationId,
      action: 'generate_response',
      status: 'success',
      execution_time_ms: executionTime,
      metadata: { agent: agentCode, tokens: usage.total_tokens, rag_used: knowledgeStr !== "MVNI Hub: Telecom SaaS Enterprise." }
    })

    return new Response(JSON.stringify({
      success: true,
      response: aiText,
      delay_ms: Math.min(5000, aiText.length * 35),
      agent: agentCode,
      metrics: { tokens: usage.total_tokens, time: executionTime }
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error) {
    console.error('AI Engine Error:', error)
    return new Response(JSON.stringify({ success: false, error: error.message }), { 
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})
