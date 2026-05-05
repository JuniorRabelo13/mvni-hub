import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const EXTERNAL_API_URL = "http://155.133.23.9:3333"

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
      const response = await fetch(`${EXTERNAL_API_URL}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await response.json()
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Rota: GET /qr/:id
    if (path.startsWith('/qr/') && req.method === 'GET') {
      const id = path.split('/')[2]
      const response = await fetch(`${EXTERNAL_API_URL}/qr/${id}`)
      const data = await response.json()
      return new Response(JSON.stringify(data), {
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
