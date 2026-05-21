import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body = await req.json().catch(() => ({}))
    const { action, queue_name, worker_id } = body

    // 1. Registro de Worker
    if (action === 'register_worker') {
      const { data, error } = await supabase
        .from('queue_workers')
        .insert([{ name: `worker-${crypto.randomUUID().split('-')[0]}`, status: 'idle' }])
        .select()
        .single()
      
      if (error) throw error
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // 2. Coleta de Jobs (Orquestração Centralizada)
    if (action === 'fetch_jobs') {
      const { data: jobs, error } = await supabase.rpc('get_next_jobs', { 
        p_queue: queue_name, 
        p_worker_id: worker_id,
        p_limit: 5 
      })

      if (error) throw error
      return new Response(JSON.stringify({ jobs }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // 3. Health Check & Cleanup
    if (action === 'health_check') {
      await supabase
        .from('queue_workers')
        .update({ status: 'offline' })
        .lt('last_ping', new Date(Date.now() - 300000).toISOString())

      return new Response(JSON.stringify({ status: 'healthy' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ error: 'Invalid action or empty body' }), { status: 400, headers: corsHeaders })

  } catch (error) {
    console.error('Orchestrator Error:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders })
  }
})
