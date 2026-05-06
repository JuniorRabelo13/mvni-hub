import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
};

const EXTERNAL_API_URL = Deno.env.get("WHATSAPP_PROVIDER_URL") || "http://155.133.23.9:3333";
const PROVIDER_TIMEOUT_MS = 15000; // 15 seconds for QR generation

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { 
    status, 
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    }
  });
}

async function fetchWithTimeout(url: string, init?: RequestInit, timeoutMs = PROVIDER_TIMEOUT_MS) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(id);
  }
}

serve(async (req) => {
  // 1. Mandatory CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const startTime = Date.now();
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();
  const url = new URL(req.url);
  
  // Robust Path Parsing
  const pathParts = url.pathname.split('/').filter(Boolean);
  let cleanParts = [...pathParts];
  
  // Handle Supabase routing (/functions/v1/whatsapp-api/...)
  const apiIdx = cleanParts.indexOf('whatsapp-api');
  if (apiIdx !== -1) {
    cleanParts = cleanParts.slice(apiIdx + 1);
  }
  
  const route = '/' + cleanParts.join('/');
  let sessionId = cleanParts.length > 1 ? cleanParts[1] : undefined;

  try {
    // Structured Logging
    console.log(JSON.stringify({
      event: "request_received",
      route,
      method: req.method,
      sessionId,
      requestId,
      timestamp: new Date().toISOString()
    }));

    // GET /health
    if (route === "/health" && req.method === "GET") {
      return json({ success: true });
    }

    // POST /start
    if (route === "/start" && req.method === "POST") {
      console.log(JSON.stringify({
        event: "START_SESSION_BEGIN",
        requestId,
        timestamp: new Date().toISOString()
      }));

      let body;
      try {
        body = await req.json();
        console.log(JSON.stringify({
          event: "START_PAYLOAD_READY",
          sessionId: body?.sessionId,
          requestId,
          timestamp: new Date().toISOString()
        }));
      } catch (e) {
        console.error(JSON.stringify({
          event: "START_PAYLOAD_ERROR",
          requestId,
          error: "INVALID_JSON_BODY",
          timestamp: new Date().toISOString()
        }));
        return json({ success: false, error: "INVALID_JSON_BODY" }, 400);
      }
      
      sessionId = body?.sessionId;
      if (!sessionId) {
        return json({ success: false, error: "sessionId is required" }, 400);
      }

      console.log(JSON.stringify({
        event: "PROVIDER_CALL_BEGIN",
        url: `${EXTERNAL_API_URL}/start`,
        sessionId,
        requestId,
        timestamp: new Date().toISOString()
      }));

      try {
        const startSession = () => fetchWithTimeout(`${EXTERNAL_API_URL}/start`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        const response = await Promise.race([
          startSession(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("START_TIMEOUT")), 15000)
          )
        ]) as Response;

        const data = await response.json().catch(() => ({}));
        
        console.log(JSON.stringify({
          event: "PROVIDER_CALL_COMPLETE",
          sessionId,
          requestId,
          status: response.status,
          durationMs: Date.now() - startTime,
          timestamp: new Date().toISOString()
        }));

        console.log(JSON.stringify({
          event: "START_SESSION_SUCCESS",
          sessionId,
          requestId,
          timestamp: new Date().toISOString()
        }));

        return json({ 
          success: response.ok, 
          providerStatus: response.status,
          ...data 
        }, response.ok ? 200 : 502);
      } catch (error) {
        const isTimeout = error instanceof Error && error.message === "START_TIMEOUT";
        console.error(JSON.stringify({
          event: isTimeout ? "START_SESSION_TIMEOUT" : "PROVIDER_CALL_FAILED",
          sessionId,
          requestId,
          error: String(error),
          durationMs: Date.now() - startTime,
          timestamp: new Date().toISOString()
        }));
        
        if (isTimeout) {
          return json({ success: false, error: "START_TIMEOUT" }, 504);
        }
        throw error; // Let the global handler catch it
      }
    }

    // GET /qr/:sessionId
    if (route.startsWith("/qr/") && req.method === "GET") {
      if (!sessionId) {
        return json({ success: false, error: "sessionId is required" }, 400);
      }

      console.log(JSON.stringify({
        event: "provider_qr_init",
        sessionId,
        requestId,
        timestamp: new Date().toISOString()
      }));

      try {
        const response = await fetchWithTimeout(`${EXTERNAL_API_URL}/qr/${sessionId}`);
        
        if (!response.ok) {
          return json({ 
            success: false, 
            error: "QR_NOT_READY", 
            providerStatus: response.status 
          }, 200);
        }

        const data = await response.json().catch(() => ({}));
        
        if (data.qr) {
          console.log(JSON.stringify({
            event: "provider_qr_success",
            sessionId,
            requestId,
            timestamp: new Date().toISOString()
          }));
          return json({ success: true, qr: data.qr });
        }

        return json({ success: false, error: "QR_NOT_READY" });
      } catch (err) {
        console.error(JSON.stringify({
          event: "provider_qr_timeout_or_error",
          sessionId,
          requestId,
          error: String(err),
          timestamp: new Date().toISOString()
        }));
        return json({ success: false, error: "QR_NOT_READY", details: "PROVIDER_TIMEOUT_OR_ERROR" });
      }
    }

    // GET /status/:sessionId
    if (route.startsWith("/status/") && req.method === "GET") {
      if (!sessionId) {
        return json({ success: false, error: "sessionId is required" }, 400);
      }

      const response = await fetchWithTimeout(`${EXTERNAL_API_URL}/status/${sessionId}`);
      const data = await response.json().catch(() => ({}));
      
      return json({ 
        success: response.ok, 
        providerStatus: response.status,
        ...data 
      }, response.ok ? 200 : 502);
    }

    // 404 Fallback
    return json({ 
      success: false, 
      error: "ENDPOINT_NOT_FOUND", 
      path: route 
    }, 404);

  } catch (err) {
    // 5. Global Exception Handler
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(JSON.stringify({
      event: "unhandled_exception",
      route,
      method: req.method,
      sessionId,
      requestId,
      error: errorMsg,
      timestamp: new Date().toISOString()
    }));

    return json({
      success: false,
      error: errorMsg
    }, 500);
  }
});
