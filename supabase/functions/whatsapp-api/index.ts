import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const EXTERNAL_API_URL = "http://155.133.23.9:3333"

// Cache em memória para estados de sessão
// Em produção com múltiplas instâncias do Edge Function, 
// o ideal seria Redis ou Database, mas para persistência temporária 
// entre polling na mesma instância ou curta duração, usamos Map.
interface SessionState {
  sessionId: string;
  status: "iniciando" | "gerando_qr" | "qr_pronto" | "conectado" | "desconectado" | "erro";
  qr?: string | null;
  lastError?: string;
  updatedAt: number;
}

const sessionCache = new Map<string, SessionState>();

// TTL de 10 minutos
const SESSION_TTL = 10 * 60 * 1000;

// Limpeza automática de sessões expiradas
setInterval(() => {
  const now = Date.now();
  for (const [id, session] of sessionCache.entries()) {
    if (now - session.updatedAt > SESSION_TTL) {
      console.log(`[Session] Cleaning up expired session: ${id}`);
      sessionCache.delete(id);
    }
  }
}, 60000);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const url = new URL(req.url)
  const path = url.pathname.replace('/whatsapp-api', '')

  try {
    // Rota: POST /start
    if (path === '/start' && req.method === 'POST') {
      const body = await req.json()
      const { sessionId, agentId } = body;

      if (!sessionId) {
        return new Response(JSON.stringify({ error: 'sessionId is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      console.log(`[Session ${sessionId}] Starting connection for agent ${agentId}`);

      // Inicializa estado no cache
      sessionCache.set(sessionId, {
        sessionId,
        status: "iniciando",
        updatedAt: Date.now()
      });

      try {
        const response = await fetch(`${EXTERNAL_API_URL}/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        })
        
        const data = await response.json()
        
        // Atualiza estado após resposta do backend real
        const current = sessionCache.get(sessionId);
        if (current) {
          sessionCache.set(sessionId, {
            ...current,
            status: "gerando_qr",
            updatedAt: Date.now()
          });
        }

        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      } catch (err) {
        console.error(`[Session ${sessionId}] Error starting:`, err);
        sessionCache.set(sessionId, {
          sessionId,
          status: "erro",
          lastError: err.message,
          updatedAt: Date.now()
        });
        throw err;
      }
    }

    // Rota: GET /qr/:id
    if (path.startsWith('/qr/') && req.method === 'GET') {
      const sessionId = path.split('/')[2]
      
      console.log(`[Session ${sessionId}] Polling QR...`);

      // Tenta buscar do cache primeiro para evitar 404 imediatos
      let cached = sessionCache.get(sessionId);

      try {
        const response = await fetch(`${EXTERNAL_API_URL}/qr/${sessionId}`)
        if (response.ok) {
          const data = await response.json()
          
          // Atualiza cache com dados reais do backend
          const newStatus = data.qr ? "qr_pronto" : (data.status === "conectado" ? "conectado" : "gerando_qr");
          
          sessionCache.set(sessionId, {
            sessionId,
            status: newStatus as any,
            qr: data.qr,
            updatedAt: Date.now()
          });

          return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
      } catch (err) {
        console.error(`[Session ${sessionId}] Fetch error:`, err);
      }

      // Se falhou fetch mas temos cache, retorna cache como fallback
      if (cached) {
        return new Response(JSON.stringify({
          status: cached.status,
          qr: cached.qr,
          sessionId: cached.sessionId,
          fromCache: true
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      return new Response(JSON.stringify({ error: 'Session not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Rota: GET /status/:id
    if (path.startsWith('/status/') && req.method === 'GET') {
      const id = path.split('/')[2]
      const response = await fetch(`${EXTERNAL_API_URL}/status/${id}`)
      const data = await response.json()
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ error: 'Not Found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error in whatsapp-api proxy:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})