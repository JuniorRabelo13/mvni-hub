import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Content-Type": "application/json",
};

const EXTERNAL_API_URL = Deno.env.get("WHATSAPP_PROVIDER_URL") || "http://155.133.23.9:3333";
const PROVIDER_TIMEOUT_MS = 8000;

interface SessionState {
  sessionId: string;
  status: "iniciando" | "gerando_qr" | "qr_pronto" | "conectado" | "desconectado" | "erro";
  qr?: string | null;
  lastError?: string;
  updatedAt: number;
}

const sessionCache = new Map<string, SessionState>();
const SESSION_TTL = 10 * 60 * 1000;

setInterval(() => {
  const now = Date.now();
  for (const [id, s] of sessionCache.entries()) {
    if (now - s.updatedAt > SESSION_TTL) sessionCache.delete(id);
  }
}, 60000);

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

function logEvent(data: Record<string, unknown>) {
  try {
    console.log(JSON.stringify({ timestamp: new Date().toISOString(), ...data }));
  } catch {
    console.log("[log] (unserializable event)");
  }
}

async function fetchWithTimeout(url: string, init?: RequestInit, timeoutMs = PROVIDER_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(t);
  }
}

serve(async (req) => {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID();

  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  let route = "";
  let sessionId: string | undefined;

  try {
    const url = new URL(req.url);
    const path = url.pathname.replace("/whatsapp-api", "") || "/";
    route = path;

    logEvent({ event: "request_in", route, method: req.method, requestId });

    // GET /health
    if (path === "/health" && req.method === "GET") {
      return json({ success: true, service: "whatsapp-api", uptime: Date.now() });
    }

    // POST /start
    if (path === "/start" && req.method === "POST") {
      const startTime = Date.now();
      let body: any = {};
      try {
        body = await req.json();
      } catch {
        return json({ success: false, error: "INVALID_JSON_BODY" }, 400);
      }

      sessionId = body?.sessionId;
      const agentId = body?.agentId;

      if (!sessionId) {
        return json({ success: false, error: "sessionId is required" }, 400);
      }

      logEvent({ event: "start_request", route, method: "POST", sessionId, agentId, requestId });

      sessionCache.set(sessionId, {
        sessionId,
        status: "iniciando",
        updatedAt: Date.now(),
      });

      try {
        const response = await fetchWithTimeout(`${EXTERNAL_API_URL}/start`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        let data: any = {};
        try {
          data = await response.json();
        } catch {
          data = { providerStatus: response.status };
        }

        const current = sessionCache.get(sessionId);
        if (current) {
          sessionCache.set(sessionId, {
            ...current,
            status: response.ok ? "gerando_qr" : "erro",
            lastError: response.ok ? undefined : `provider_status_${response.status}`,
            updatedAt: Date.now(),
          });
        }

        logEvent({
          event: "start_response",
          sessionId,
          agentId,
          requestId,
          providerStatus: response.status,
          durationMs: Date.now() - startTime,
        });

        return json({ success: response.ok, ...data }, response.ok ? 200 : 502);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        sessionCache.set(sessionId, {
          sessionId,
          status: "erro",
          lastError: msg,
          updatedAt: Date.now(),
        });
        logEvent({ event: "start_provider_error", sessionId, requestId, error: msg });
        return json({ success: false, error: "PROVIDER_UNREACHABLE", details: msg }, 502);
      }
    }

    // GET /qr/:sessionId
    if (path.startsWith("/qr/") && req.method === "GET") {
      sessionId = path.split("/")[2];
      if (!sessionId) return json({ success: false, error: "sessionId is required" }, 400);

      logEvent({ event: "qr_poll", route, method: "GET", sessionId, requestId });

      const cached = sessionCache.get(sessionId);

      try {
        const response = await fetchWithTimeout(`${EXTERNAL_API_URL}/qr/${sessionId}`);
        if (response.ok) {
          let data: any = {};
          try {
            data = await response.json();
          } catch {
            data = {};
          }

          const newStatus = data.qr
            ? "qr_pronto"
            : data.status === "conectado"
            ? "conectado"
            : "gerando_qr";

          sessionCache.set(sessionId, {
            sessionId,
            status: newStatus as any,
            qr: data.qr ?? null,
            updatedAt: Date.now(),
          });

          if (data.qr) {
            return json({ success: true, qr: data.qr, status: newStatus, sessionId });
          }
          if (newStatus === "conectado") {
            return json({ success: true, status: "conectado", sessionId });
          }
          return json({ success: false, error: "QR_NOT_READY", status: newStatus, sessionId }, 200);
        }

        // Provider returned non-OK
        if (cached) {
          return json({
            success: !!cached.qr,
            qr: cached.qr ?? undefined,
            status: cached.status,
            sessionId: cached.sessionId,
            fromCache: true,
          });
        }
        return json({ success: false, error: "QR_NOT_READY", providerStatus: response.status }, 200);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        logEvent({ event: "qr_provider_error", sessionId, requestId, error: msg });
        if (cached) {
          return json({
            success: !!cached.qr,
            qr: cached.qr ?? undefined,
            status: cached.status,
            sessionId: cached.sessionId,
            fromCache: true,
          });
        }
        return json({ success: false, error: "QR_NOT_READY", details: msg }, 200);
      }
    }

    // GET /status/:sessionId
    if (path.startsWith("/status/") && req.method === "GET") {
      sessionId = path.split("/")[2];
      if (!sessionId) return json({ success: false, error: "sessionId is required" }, 400);

      logEvent({ event: "status_request", route, method: "GET", sessionId, requestId });

      try {
        const response = await fetchWithTimeout(`${EXTERNAL_API_URL}/status/${sessionId}`);
        let data: any = {};
        try {
          data = await response.json();
        } catch {
          data = {};
        }
        return json({ success: response.ok, ...data }, response.ok ? 200 : 502);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const cached = sessionCache.get(sessionId);
        if (cached) {
          return json({ success: true, status: cached.status, sessionId, fromCache: true });
        }
        return json({ success: false, error: "PROVIDER_UNREACHABLE", details: msg }, 502);
      }
    }

    return json({ success: false, error: "NOT_FOUND", route, method: req.method }, 404);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logEvent({ event: "unhandled_error", route, requestId, sessionId, error: msg });
    return json({ success: false, error: `INTERNAL_ERROR: ${msg}` }, 500);
  }
});
