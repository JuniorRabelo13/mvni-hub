import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { requireCronOrAdmin } from "../_shared/auth.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // SECURITY: only the cron scheduler (shared secret) or admins may dispatch bulk notifications
  const _authResp = await requireCronOrAdmin(req)
  if (_authResp) return new Response(_authResp.body, { status: _authResp.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const today = new Date()
    const formatDate = (date: Date) => date.toISOString().split('T')[0]
    const formatDisplayDate = (date: Date) => date.toLocaleDateString('pt-BR')

    const dateToday = formatDate(today)
    
    const threeDaysLater = new Date()
    threeDaysLater.setDate(today.getDate() + 3)
    const dateThreeDaysLater = formatDate(threeDaysLater)

    const yesterday = new Date()
    yesterday.setDate(today.getDate() - 1)
    const dateYesterday = formatDate(yesterday)

    const resumo = {
      pre_vencimento: 0,
      vencimento_hoje: 0,
      pos_vencimento: 0,
      erros: 0
    }

    const baseFunctionUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/enviar-notificacao-vencimento`
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    const callNotification = async (cliente_id: string, tipo: string, data_vencimento: string, valor: number, fatura_id: string) => {
      try {
        const response = await fetch(baseFunctionUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${serviceRoleKey}`,
            'Content-Type': 'application/json',
            'X-Cron-Secret': Deno.env.get('CRON_SECRET') ?? '',
          },
          body: JSON.stringify({
            cliente_id,
            tipo,
            data_vencimento: formatDisplayDate(new Date(data_vencimento + 'T12:00:00')),
            valor,
            fatura_id
          })
        })
        return response.ok
      } catch (err) {
        console.error(`Erro ao chamar enviar-notificacao-vencimento: ${err.message}`)
        return false
      }
    }

    // 1. Pré-vencimento (hoje + 3 dias)
    const { data: preVencimentoList } = await supabase
      .from('pagamentos')
      .select('id, cliente_id, valor, data_vencimento')
      .eq('data_vencimento', dateThreeDaysLater)
      .neq('status', 'pago')

    if (preVencimentoList) {
      for (const item of preVencimentoList) {
        const success = await callNotification(item.cliente_id, 'pre_vencimento', item.data_vencimento, item.valor, item.id)
        if (success) resumo.pre_vencimento++
        else resumo.erros++
      }
    }

    // 2. Vencimento Hoje
    const { data: hojeList } = await supabase
      .from('pagamentos')
      .select('id, cliente_id, valor, data_vencimento')
      .eq('data_vencimento', dateToday)
      .neq('status', 'pago')

    if (hojeList) {
      for (const item of hojeList) {
        const success = await callNotification(item.cliente_id, 'vencimento_hoje', item.data_vencimento, item.valor, item.id)
        if (success) resumo.vencimento_hoje++
        else resumo.erros++
      }
    }

    // 3. Pós-vencimento (ontem + status falhou)
    const { data: ontemList } = await supabase
      .from('pagamentos')
      .select('id, cliente_id, valor, data_vencimento')
      .eq('data_vencimento', dateYesterday)
      .eq('status', 'falhou')

    if (ontemList) {
      for (const item of ontemList) {
        const success = await callNotification(item.cliente_id, 'pos_vencimento', item.data_vencimento, item.valor, item.id)
        if (success) resumo.pos_vencimento++
        else resumo.erros++
      }
    }

    return new Response(JSON.stringify({ success: true, resumo }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Erro na function disparar-notificacoes-dia:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
