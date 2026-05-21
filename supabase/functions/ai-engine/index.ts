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

    const { 
      action, 
      lead_id, 
      cliente_id, 
      whatsapp_instance_id, 
      message,
      agent_code = 'agent_sdr' // Default to SDR
    } = await req.json()

    // 1. Context Assembly
    let context = ""
    let clientName = "Cliente"
    let statusContext = ""

    if (cliente_id) {
      const { data: cliente } = await supabaseAdmin.from('clientes').select('*, linhas(*), pagamentos(*)').eq('id', cliente_id).single()
      if (cliente) {
        clientName = cliente.nome
        const activeLines = cliente.linhas?.filter((l: any) => l.status === 'active').length || 0
        const pendingPayments = cliente.pagamentos?.filter((p: any) => p.status === 'pending').length || 0
        statusContext = `Status: Cliente Ativo. Linhas Ativas: ${activeLines}. Pagamentos Pendentes: ${pendingPayments}.`
      }
    } else if (lead_id) {
      const { data: lead } = await supabaseAdmin.from('leads').select('*').eq('id', lead_id).single()
      if (lead) {
        clientName = lead.nome
        statusContext = `Status: Lead. Interesse registrado no histórico.`
      }
    }

    // 2. Memory Retrieval
    const { data: memory } = await supabaseAdmin
      .from('ai_memory')
      .select('key, value')
      .or(`cliente_id.eq.${cliente_id},lead_id.eq.${lead_id}`)
    
    const memoryContext = memory?.map(m => `${m.key}: ${m.value}`).join('\n') || "Sem memórias prévias."

    // 3. Conversation Management
    let conversationId: string
    const { data: existingConv } = await supabaseAdmin
      .from('ai_conversations')
      .select('id, metadata')
      .or(`cliente_id.eq.${cliente_id},lead_id.eq.${lead_id}`)
      .eq('whatsapp_instance_id', whatsapp_instance_id)
      .eq('status', 'active')
      .single()

    if (existingConv) {
      conversationId = existingConv.id
    } else {
      const { data: newConv } = await supabaseAdmin
        .from('ai_conversations')
        .insert({
          cliente_id,
          lead_id,
          whatsapp_instance_id,
          metadata: { initial_context: statusContext }
        })
        .select()
        .single()
      conversationId = newConv.id
    }

    // Load recent history (last 10 messages)
    const { data: history } = await supabaseAdmin
      .from('ai_messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(10)

    const historyMessages = history?.reverse().map(m => ({ role: m.role, content: m.content })) || []

    // 4. Agent Settings
    const { data: agent } = await supabaseAdmin
      .from('ai_agent_settings')
      .select('*')
      .eq('code', agent_code)
      .single()

    if (!agent) throw new Error(`Agente ${agent_code} não encontrado`)

    // 5. Build System Prompt
    const systemPrompt = `
${agent.base_prompt}
Nome do Contato: ${clientName}
Contexto Atual: ${statusContext}
Memória de Longo Prazo:
${memoryContext}
    `

    // 6. OpenAI API Call (GPT-4o)
    const openAiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openAiApiKey) throw new Error("OPENAI_API_KEY não configurada")

    const messages = [
      { role: "system", content: systemPrompt },
      ...historyMessages,
      { role: "user", content: message }
    ]

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openAiApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: agent.model || "gpt-4o",
        messages,
        temperature: agent.temperature,
        max_tokens: agent.max_tokens,
        user: conversationId
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`OpenAI Error: ${JSON.stringify(errorData)}`)
    }

    const aiResult = await response.json()
    const aiText = aiResult.choices[0].message.content
    const usage = aiResult.usage

    // 7. Post-Processing & Persistence
    // Save messages
    await supabaseAdmin.from('ai_messages').insert([
      { conversation_id: conversationId, role: 'user', content: message },
      { conversation_id: conversationId, role: 'assistant', content: aiText, agent_id: agent.id }
    ])

    // Save token usage
    const costPerPromptToken = 0.000005 // Example for GPT-4o
    const costPerCompletionToken = 0.000015
    const estimatedCost = (usage.prompt_tokens * costPerPromptToken) + (usage.completion_tokens * costPerCompletionToken)

    await supabaseAdmin.from('ai_token_usage').insert({
      conversation_id: conversationId,
      model: agent.model,
      prompt_tokens: usage.prompt_tokens,
      completion_tokens: usage.completion_tokens,
      total_tokens: usage.total_tokens,
      estimated_cost: estimatedCost
    })

    // Update conversation
    await supabaseAdmin.from('ai_conversations').update({
      last_message_at: new Date().toISOString()
    }).eq('id', conversationId)

    // Automation Log
    const executionTime = Date.now() - startTime
    await supabaseAdmin.from('ai_automation_logs').insert({
      conversation_id: conversationId,
      action: 'generate_response',
      status: 'success',
      execution_time_ms: executionTime,
      metadata: { agent: agent_code, tokens: usage.total_tokens }
    })

    // Lead Scoring Logic (Simplified Enterprise)
    if (lead_id) {
      let scoreChange = 0
      const lowerText = aiText.toLowerCase()
      if (lowerText.includes('agendar') || lowerText.includes('demonstração')) scoreChange = 20
      if (lowerText.includes('interessado')) scoreChange = 10
      
      const { data: currentScore } = await supabaseAdmin.from('ai_lead_scores').select('score_value').eq('lead_id', lead_id).single()
      const newScore = Math.min(100, (currentScore?.score_value || 0) + scoreChange)
      
      let classification = 'cold'
      if (newScore > 70) classification = 'hot'
      else if (newScore > 30) classification = 'warm'

      await supabaseAdmin.from('ai_lead_scores').upsert({
        lead_id,
        score_value: newScore,
        classification,
        last_update: new Date().toISOString()
      })
    }

    // Human-like delay return
    const typingDelay = Math.min(5000, aiText.length * 50) // 50ms per char, max 5s

    return new Response(JSON.stringify({ 
      success: true, 
      response: aiText, 
      delay_ms: typingDelay,
      agent: agent_code,
      tokens: usage.total_tokens,
      cost: estimatedCost
    }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 
    })

  } catch (error) {
    console.error('AI Engine Error:', error)
    return new Response(JSON.stringify({ success: false, error: error.message }), { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500 
    })
  }
})