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
    const addDays = (n: number) => { const d = new Date(); d.setDate(today.getDate() + n); return d }

    const dateToday = formatDate(today)
    const date5daysLater = formatDate(addDays(5))
    const date2daysLater = formatDate(addDays(2))
    const dateYesterday = formatDate(addDays(-1))

    const resumo = {
      pre_vencimento_5: 0,
      pre_vencimento_2: 0,
      vencimento_hoje: 0,
      pos_vencimento: 0,
      erros: 0,
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
            fatura_id,
          }),
        })
        return response.ok
      } catch (err) {
        console.error(`Erro ao chamar enviar-notificacao-vencimento: ${(err as Error).message}`)
        return false
      }
    }

    const dispatchBatch = async (dateStr: string, tipo: 'pre_vencimento_5' | 'pre_vencimento_2' | 'vencimento_hoje' | 'pos_vencimento', extra?: { status?: string }) => {
      let q = supabase
        .from('pagamentos')
        .select('id, cliente_id, valor, data_vencimento')
        .eq('data_vencimento', dateStr)
      if (extra?.status) q = q.eq('status', extra.status)
      else q = q.neq('status', 'pago')
      const { data } = await q
      for (const item of (data ?? [])) {
        const ok = await callNotification(item.cliente_id, tipo, item.data_vencimento, item.valor, item.id)
        if (ok) resumo[tipo]++
        else resumo.erros++
      }
    }

    await dispatchBatch(date5daysLater, 'pre_vencimento_5')
    await dispatchBatch(date2daysLater, 'pre_vencimento_2')
    await dispatchBatch(dateToday, 'vencimento_hoje')
    await dispatchBatch(dateYesterday, 'pos_vencimento', { status: 'falhou' })

    return new Response(JSON.stringify({ success: true, resumo }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Erro na function disparar-notificacoes-dia:', error)
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
