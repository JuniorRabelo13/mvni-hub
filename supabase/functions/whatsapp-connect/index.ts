import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, agentId } = await req.json()

    if (!agentId) {
      throw new Error('agentId is required')
    }

    if (action === 'connect') {
      console.log(`Iniciando conexão para o agente ${agentId}`)

      // 1. Atualizar para status 'iniciando' para o Worker Node.js processar
      const { error: updateError } = await supabase.from('whatsapp_agents').update({
        status_conexao: 'iniciando',
        conectado: false,
        qr_code: null
      }).eq('id', agentId);

      if (updateError) throw updateError;

      return new Response(JSON.stringify({ 
        status: 'iniciando', 
        message: "O worker está iniciando a sessão. O QR Code aparecerá em instantes."
      }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    if (action === 'disconnect') {
      console.log(`Desconectando agente ${agentId}`);
      
      await supabase.from('whatsapp_agents').update({
        status_conexao: 'desconectado',
        conectado: false,
        qr_code: null
      }).eq('id', agentId);

      // Limpar sessões se existirem
      await supabase
        .from('whatsapp_sessions')
        .delete()
        .eq('agent_id', agentId);

      return new Response(JSON.stringify({ status: 'disconnected' }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      })
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })

  } catch (error) {
    console.error('Erro no whatsapp-connect:', error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})