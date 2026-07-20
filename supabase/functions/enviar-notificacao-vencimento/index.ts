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

  // SECURITY: internal cron caller (shared secret) or admin only
  const _authResp = await requireCronOrAdmin(req)
  if (_authResp) return new Response(_authResp.body, { status: _authResp.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  try {
    const { cliente_id, tipo, data_vencimento, valor, fatura_id } = await req.json()
    
    // Conectar ao Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Buscar nome e telefone do cliente na tabela clientes
    const { data: cliente, error: errorCliente } = await supabase
      .from('clientes')
      .select('nome, telefone, user_id')
      .eq('id', cliente_id)
      .single()

    if (errorCliente || !cliente) {
      throw new Error(`Cliente não encontrado: ${errorCliente?.message}`)
    }

    // 2. Montar a mensagem conforme o tipo
    let mensagem = ""
    const valorFormatado = Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

    switch (tipo) {
      case 'pre_vencimento_5':
      case 'pre_vencimento': // legado (compat)
        mensagem = `Olá ${cliente.nome}, sua fatura MVNI de R$${valorFormatado} vence em 5 dias (${data_vencimento}). Programe o pagamento e mantenha sua linha ativa. 🙌`
        break
      case 'pre_vencimento_2':
        mensagem = `${cliente.nome}, faltam 2 dias para o vencimento da sua fatura MVNI de R$${valorFormatado} (${data_vencimento}). Pague em dia e evite bloqueios. 📱`
        break
      case 'vencimento_hoje':
        mensagem = `Olá ${cliente.nome}, sua fatura MVNI de R$${valorFormatado} vence hoje (${data_vencimento}). Pague agora para não perder o sinal. ⏰`
        break
      case 'pos_vencimento':
        mensagem = `${cliente.nome}, sua fatura MVNI de R$${valorFormatado} está em atraso desde ${data_vencimento}. Regularize para reativar sua linha. ⚠️`
        break
      case 'pagamento_confirmado':
        mensagem = `${cliente.nome}, recebemos o pagamento da sua fatura MVNI de R$${valorFormatado}. Sua linha continua ativa e conectada. ✅ Obrigado!`
        break
      default:
        throw new Error("Tipo de notificação inválido")
    }

    // 3. Enviar a mensagem via Z-API
    const zapiInstance = Deno.env.get('ZAPI_INSTANCE')
    const zapiToken = Deno.env.get('ZAPI_TOKEN')
    let statusEnvio = "enviado"

    if (!zapiInstance || !zapiToken) {
      console.error("ZAPI_INSTANCE ou ZAPI_TOKEN não configurados")
      statusEnvio = "falhou"
    } else {
      try {
        const phone = cliente.telefone.replace(/\D/g, '')
        const zapiResponse = await fetch(`https://api.z-api.io/instances/${zapiInstance}/token/${zapiToken}/send-text`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phone: phone,
            message: mensagem
          }),
        })

        if (!zapiResponse.ok) {
          const errorData = await zapiResponse.json()
          console.error(`Erro ao enviar mensagem via Z-API: ${JSON.stringify(errorData)}`)
          statusEnvio = "falhou"
        }
      } catch (err) {
        console.error(`Erro na requisição Z-API: ${err.message}`)
        statusEnvio = "falhou"
      }
    }

    // 4. Inserir registro na nova tabela notificacoes_vencimento
    const { error: errorVencimento } = await supabase
      .from('notificacoes_vencimento')
      .insert({
        numero_whatsapp: cliente.telefone,
        status: statusEnvio === "enviado" ? "Enviada" : "Falha",
        fatura_id: fatura_id,
        mensagem_enviada: mensagem,
        erro: statusEnvio === "falhou" ? "Erro ao enviar via Z-API" : null
      })

    if (errorVencimento) {
      console.error(`Erro ao salvar histórico de vencimento: ${errorVencimento.message}`)
    }

    // 5. Inserir registro na tabela notificacoes (mantendo compatibilidade legada se necessário)
    const { error: errorNotificacao } = await supabase
      .from('notificacoes')
      .insert({
        cliente_id: cliente_id,
        tipo: tipo,
        canal: 'whatsapp',
        mensagem: mensagem,
        status: statusEnvio,
        user_id: cliente.user_id
      })

    if (errorNotificacao) {
      console.error(`Erro ao salvar notificação: ${errorNotificacao.message}`)
    }

    return new Response(JSON.stringify({ success: statusEnvio === "enviado", status: statusEnvio }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: statusEnvio === "enviado" ? 200 : 400,
    })

  } catch (error) {
    console.error('Erro na function enviar-notificacao-vencimento:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
