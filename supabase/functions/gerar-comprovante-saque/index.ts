import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1"
import { requireUser, userHasRole } from "../_shared/auth.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  // SECURITY: must be authenticated
  const _auth = await requireUser(req)
  if (_auth.response) return new Response(_auth.response.body, { status: _auth.response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { saque_id } = await req.json()
    if (!saque_id) throw new Error("ID do saque é obrigatório")

    // 1. Buscar dados do saque e do usuário
    const { data: saque, error: sError } = await supabaseAdmin
      .from('solicitacoes_saque')
      .select('*, dados_bancarios(*)')
      .eq('id', saque_id)
      .single()

    if (sError || !saque) throw new Error("Saque não encontrado")

    // SECURITY: only the owner or an admin may generate the receipt
    const _isAdmin = await userHasRole(_auth.user!.id, ["admin", "master_admin"])
    if (saque.user_id !== _auth.user!.id && !_isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { data: userProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('email')
      .eq('id', saque.user_id)
      .single()

    // 2. Criar PDF
    const pdfDoc = await PDFDocument.create()
    const page = pdfDoc.addPage([600, 400])
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    page.drawText('COMPROVANTE DE TRANSFERÊNCIA PIX', { x: 50, y: 350, size: 18, font: fontBold, color: rgb(0, 0, 0) })
    
    page.drawText('DADOS DO PAGADOR', { x: 50, y: 310, size: 10, font: fontBold, color: rgb(0.5, 0.5, 0.5) })
    page.drawText('LOVABLE SAAS TECNOLOGIA LTDA', { x: 50, y: 295, size: 12, font })
    
    page.drawText('DADOS DO BENEFICIÁRIO', { x: 50, y: 260, size: 10, font: fontBold, color: rgb(0.5, 0.5, 0.5) })
    page.drawText(`Nome: ${saque.dados_bancarios.titular_nome}`, { x: 50, y: 245, size: 12, font })
    page.drawText(`CPF: ${saque.dados_bancarios.titular_cpf}`, { x: 50, y: 230, size: 12, font })
    page.drawText(`Chave Pix: ${saque.dados_bancarios.chave_pix}`, { x: 50, y: 215, size: 12, font })

    page.drawText('DETALHES DO SAQUE', { x: 50, y: 180, size: 10, font: fontBold, color: rgb(0.5, 0.5, 0.5) })
    page.drawText(`Valor: R$ ${saque.valor.toFixed(2).replace('.', ',')}`, { x: 50, y: 165, size: 14, font: fontBold, color: rgb(0.1, 0.6, 0.1) })
    page.drawText(`Data: ${new Date(saque.solicitado_em).toLocaleString('pt-BR')}`, { x: 50, y: 145, size: 12, font })
    page.drawText(`Protocolo: ${saque.id}`, { x: 50, y: 130, size: 8, font, color: rgb(0.6, 0.6, 0.6) })

    page.drawText('Este documento serve como registro da operação financeira realizada.', { x: 50, y: 50, size: 8, font, color: rgb(0.5, 0.5, 0.5) })

    const pdfBytes = await pdfDoc.save()

    // 3. Salvar no Storage
    const fileName = `${saque.user_id}/${saque.id}.pdf`
    const { error: uploadError } = await supabaseAdmin.storage
      .from('financeiro')
      .upload(fileName, pdfBytes, { contentType: 'application/pdf', upsert: true })

    if (uploadError) throw uploadError

    // 4. Gerar URL assinada (TTL curto para reduzir exposição)
    const { data: urlData } = await supabaseAdmin.storage
      .from('financeiro')
      .createSignedUrl(fileName, 3600) // 1 hora

    const comprobanteUrl = urlData?.signedUrl

    // 5. Atualizar tabela
    await supabaseAdmin
      .from('solicitacoes_saque')
      .update({ comprovante_url: comprobanteUrl })
      .eq('id', saque_id)

    return new Response(JSON.stringify({ url: comprobanteUrl }), {
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
