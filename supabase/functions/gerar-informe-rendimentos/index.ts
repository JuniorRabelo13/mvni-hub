import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1"

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

    const { user_id, ano } = await req.json()
    if (!user_id || !ano) throw new Error("User ID e Ano são obrigatórios")

    // 1. Buscar transações do ano
    const startDate = `${ano}-01-01T00:00:00Z`
    const endDate = `${ano}-12-31T23:59:59Z`

    const { data: transacoes, error: tError } = await supabaseAdmin
      .from('transacoes_wallet')
      .select('*')
      .eq('wallet_id', (await supabaseAdmin.from('wallets').select('id').eq('user_id', user_id).single()).data?.id)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .eq('status', 'confirmado')

    if (tError) throw tError

    // 2. Agregar dados
    const totalComissoes = transacoes
      .filter(t => t.tipo.startsWith('credito'))
      .reduce((acc, curr) => acc + Number(curr.valor), 0)
    
    const totalSaques = transacoes
      .filter(t => t.tipo === 'debito_saque')
      .reduce((acc, curr) => acc + Math.abs(Number(curr.valor)), 0)

    // 3. Criar PDF
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([600, 800])
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    page.drawText('INFORME DE RENDIMENTOS ANUAL', { x: 50, y: 750, size: 18, font: fontBold })
    page.drawText(`Ano Calendário: ${ano}`, { x: 50, y: 730, size: 12, font })

    page.drawText('FONTE PAGADORA', { x: 50, y: 690, size: 10, font: fontBold, color: rgb(0.5, 0.5, 0.5) })
    page.drawText('LOVABLE SAAS TECNOLOGIA LTDA', { x: 50, y: 675, size: 12, font })
    page.drawText('CNPJ: 00.000.000/0001-00', { x: 50, y: 660, size: 12, font })

    page.drawText('RESUMO DE RENDIMENTOS', { x: 50, y: 610, size: 10, font: fontBold, color: rgb(0.5, 0.5, 0.5) })
    page.drawText(`Rendimentos Brutos (Comissões): R$ ${totalComissoes.toFixed(2).replace('.', ',')}`, { x: 50, y: 590, size: 12, font })
    page.drawText(`Total de Retiradas Realizadas: R$ ${totalSaques.toFixed(2).replace('.', ',')}`, { x: 50, y: 575, size: 12, font })

    page.drawText('AVISO LEGAL', { x: 50, y: 150, size: 10, font: fontBold, color: rgb(0.5, 0.5, 0.5) })
    page.drawText('Os valores acima referem-se a comissões por serviços prestados na plataforma.', { x: 50, y: 135, size: 9, font })
    page.drawText('A declaração de Imposto de Renda é obrigatória se seus rendimentos tributáveis', { x: 50, y: 120, size: 9, font })
    page.drawText('ultrapassarem o teto anual estabelecido pela Receita Federal.', { x: 50, y: 105, size: 9, font })

    const pdfBytes = await pdfDoc.save()

    // 4. Salvar no Storage
    const fileName = `${user_id}/informe-${ano}.pdf`
    await supabaseAdmin.storage
      .from('financeiro')
      .upload(fileName, pdfBytes, { contentType: 'application/pdf', upsert: true })

    const { data: urlData } = await supabaseAdmin.storage
      .from('financeiro')
      .createSignedUrl(fileName, 31536000)

    return new Response(JSON.stringify({ url: urlData?.signedUrl }), {
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
