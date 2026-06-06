import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { requireRole } from "../_shared/auth.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // SECURITY: only admins/master may ingest knowledge into RAG
  const _auth = await requireRole(req, ["admin", "master_admin"])
  if (_auth.response) return new Response(_auth.response.body, { status: _auth.response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { content, metadata, source_type } = await req.json()

    if (!content) throw new Error("Conteúdo é obrigatório.")

    // 1. Generate Embedding via OpenAI
    const openAiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openAiKey) throw new Error("OPENAI_API_KEY não configurada.")

    const embRes = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openAiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: content
      })
    })

    if (!embRes.ok) throw new Error(`OpenAI Embedding Error: ${await embRes.text()}`)
    const embData = await embRes.json()
    const embedding = embData.data[0].embedding

    // 2. Save to DB
    const { data, error } = await supabaseAdmin.from('ai_context_embeddings').insert({
      content,
      embedding,
      metadata,
      source_type
    }).select().single()

    if (error) throw error

    return new Response(JSON.stringify({ success: true, id: data.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})
