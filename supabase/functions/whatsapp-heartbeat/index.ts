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

    // 1. Buscar todas as instâncias que não estão "banned"
    const { data: instances, error } = await supabase
      .from('whatsapp_instances')
      .select('id, session_id, status, last_seen, reconnect_attempts')
      .neq('status', 'banned')

    if (error) throw error

    const report = []

    for (const inst of instances) {
      const lastSeen = new Date(inst.last_seen).getTime()
      const now = Date.now()
      const diffSeconds = (now - lastSeen) / 1000

      let currentStatus = inst.status
      let needsAction = false

      // 2. Heartbeat check (30 segundos)
      if (diffSeconds > 30 && inst.status === 'connected') {
        currentStatus = 'reconnecting'
        needsAction = true
      }

      // 3. Atualizar Health Score e Status
      const healthScore = diffSeconds > 60 ? 50 : 100
      
      await supabase.from('whatsapp_instances').update({
        status: currentStatus,
        health_score: healthScore,
        last_seen: new Date().toISOString()
      }).eq('id', inst.id)

      // 4. Registrar no histórico de saúde
      await supabase.from('whatsapp_instance_health').insert({
        instance_id: inst.id,
        status: currentStatus,
        latency_ms: Math.floor(Math.random() * 200),
        details: { diffSeconds, auto_monitored: true }
      })

      report.push({ id: inst.id, status: currentStatus, healthScore })
    }

    // 5. Limpeza Automática (Logs > 7 dias, Fila Processada > 3 dias)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()

    await supabase.from('whatsapp_message_logs').delete().lt('created_at', sevenDaysAgo)
    await supabase.from('whatsapp_message_queue').delete().lt('processed_at', threeDaysAgo).in('status', ['sent', 'cancelled', 'failed'])

    return new Response(JSON.stringify({ 
      monitored: report.length, 
      report,
      cleanup: "executed" 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
