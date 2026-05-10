import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Pegar o user_id do token JWT (auth)
    const authHeader = req.headers.get('Authorization')!
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''))
    if (authError || !user) throw new Error("Não autorizado")

    const ip = req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for') || '0.0.0.0'
    const userAgent = req.headers.get('user-agent') || 'unknown'
    
    // Fingerprint simples: IP + UserAgent
    const fingerprintRaw = `${ip}-${userAgent}`
    const encoder = new TextEncoder()
    const data = encoder.encode(fingerprintRaw)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const fingerprintHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    // 1. Registrar Fingerprint
    await supabaseAdmin.from('fingerprints_login').insert({
      user_id: user.id,
      ip_address: ip,
      user_agent: userAgent,
      fingerprint_hash: fingerprintHash
    })

    // 2. Verificar Multi-Contas (Mesmo IP nos últimos 30 dias)
    const trintaDiasAtras = new Date()
    trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30)

    const { data: suspeitos, error: fetchError } = await supabaseAdmin
      .from('fingerprints_login')
      .select('user_id')
      .eq('ip_address', ip)
      .neq('user_id', user.id)
      .gte('created_at', trintaDiasAtras.toISOString())

    if (fetchError) throw fetchError

    const uniqueUsers = [...new Set(suspeitos.map(s => s.user_id))]

    // Se houver mais de 3 usuários diferentes no mesmo IP
    if (uniqueUsers.length >= 3) {
      const envolvidos = [user.id, ...uniqueUsers]
      
      // Verificar se já existe alerta recente para este grupo
      const { data: existente } = await supabaseAdmin
        .from('admin_alertas_fraude')
        .select('id')
        .eq('tipo', 'IP_COMPARTILHADO')
        .contains('user_ids', [user.id])
        .eq('resolvido', false)
        .limit(1)

      if (!existente || existente.length === 0) {
        await supabaseAdmin.from('admin_alertas_fraude').insert({
          tipo: 'IP_COMPARTILHADO',
          user_ids: envolvidos,
          score_risco: Math.min(uniqueUsers.length + 3, 10),
          detalhes: {
            ip,
            agentes: [userAgent],
            total_contas: envolvidos.length
          }
        })
      }
    }

    return new Response(JSON.stringify({ status: 'success' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})
