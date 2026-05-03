import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { cobranca_id } = await req.json()
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Buscar dados da cobrança
    const { data: cobranca, error: cobrancaError } = await supabase
      .from('cobrancas')
      .select('*, clientes(nome, cpf, email, telefone)')
      .eq('id', cobranca_id)
      .single()

    if (cobrancaError || !cobranca) {
      throw new Error('Cobrança não encontrada')
    }

    const ASAAS_API_KEY = Deno.env.get('ASAAS_API_KEY')
    const IS_MOCK = !ASAAS_API_KEY || ASAAS_API_KEY === 'mock'

    if (IS_MOCK) {
      console.log('Utilizando modo MOCK para PIX')
      // Simulação para teste sem chave
      return new Response(
        JSON.stringify({
          qr_code: "00020126360014BR.GOV.BCB.PIX0114+5511999999999520400005303986540510.005802BR5913MVNI HUB PF6009SAO PAULO62070503***6304E2B4",
          copy_paste: "00020126360014BR.GOV.BCB.PIX0114+5511999999999520400005303986540510.005802BR5913MVNI HUB PF6009SAO PAULO62070503***6304E2B4",
          transaction_id: `mock_${cobranca_id}`,
          status: 'PENDING'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 2. Gerar cobrança no Asaas
    // Nota: Para PIX no Asaas, primeiro cria uma cobrança e depois pega o QR Code
    const asaasResponse = await fetch('https://www.asaas.com/api/v3/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': ASAAS_API_KEY
      },
      body: JSON.stringify({
        customer: await getOrCreateAsaasCustomer(cobranca.clientes, ASAAS_API_KEY),
        billingType: 'PIX',
        value: cobranca.valor,
        dueDate: cobranca.vencimento,
        externalReference: cobranca.id,
        description: `Mensalidade MVNI Hub - ${cobranca.clientes.nome}`
      })
    })

    const payment = await asaasResponse.json()
    
    if (payment.errors) {
      throw new Error(payment.errors[0].description)
    }

    // 3. Pegar QR Code
    const qrCodeResponse = await fetch(`https://www.asaas.com/api/v3/payments/${payment.id}/pixQrCode`, {
      method: 'GET',
      headers: { 'access_token': ASAAS_API_KEY }
    })

    const qrCodeData = await qrCodeResponse.json()

    return new Response(
      JSON.stringify({
        qr_code: qrCodeData.encodedImage,
        copy_paste: qrCodeData.payload,
        transaction_id: payment.id,
        status: payment.status
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function getOrCreateAsaasCustomer(cliente: any, apiKey: string) {
  // Simplificado: busca por email/cpf ou cria
  const searchResponse = await fetch(`https://www.asaas.com/api/v3/customers?email=${cliente.email}`, {
    method: 'GET',
    headers: { 'access_token': apiKey }
  })
  const searchData = await searchResponse.json()
  
  if (searchData.data && searchData.data.length > 0) {
    return searchData.data[0].id
  }

  const createResponse = await fetch('https://www.asaas.com/api/v3/customers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'access_token': apiKey
    },
    body: JSON.stringify({
      name: cliente.nome,
      email: cliente.email,
      cpfCnpj: cliente.cpf,
      phone: cliente.telefone
    })
  })
  const createData = await createResponse.json()
  return createData.id
}
