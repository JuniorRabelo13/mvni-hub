import { LogEntry, logger } from "./observability";

export type ErrorCode = "NETWORK_ERROR" | "BACKEND_HTTP_ERROR" | "PROVIDER_CONNECTION_ERROR" | "UNKNOWN_ERROR" | "API_URL_INVALID";

export interface NormalizedError {
  code: ErrorCode;
  userMessage: string;
  adminMessage: string;
  endpointPath: string; // ex: /start
  resolvedUrl: string;  // ex: https://api.com/start
  baseUrl: string;      // ex: https://api.com
  method: string;
  httpStatus?: number;
  providerStatusCode?: number;
  providerReason?: string;
  rawMessage: string;
  sessionId?: string;
  requestId?: string;
}

export async function normalizeConnectError(
  err: any,
  context: {
    endpointPath: string;
    method: string;
    sessionId?: string;
    requestId?: string;
    agentId?: string;
    attempt?: number;
    startTime?: number;
  }
): Promise<NormalizedError> {
  const { endpointPath, method, sessionId, requestId, agentId, attempt, startTime } = context;
  const elapsedMs = startTime ? Date.now() - startTime : undefined;
  
  let baseUrl = "";
  let resolvedUrl = "";
  
  try {
    baseUrl = import.meta.env.VITE_WHATSAPP_API_URL || "https://hmzqfcooxqucytxwljhg.supabase.co/functions/v1/whatsapp-api";
    const cleanBase = baseUrl.replace(/\/$/, "");
    const cleanPath = endpointPath.startsWith("/") ? endpointPath : `/${endpointPath}`;
    resolvedUrl = `${cleanBase}${cleanPath}`;
  } catch (e) {
    // URL invalid already handled by buildApiUrl usually
  }

  let normalized: NormalizedError = {
    code: err.code === "API_URL_INVALID" ? "API_URL_INVALID" : "UNKNOWN_ERROR",
    userMessage: err.code === "API_URL_INVALID" ? "Configuração de API inválida." : "Ocorreu um erro inesperado. Tente novamente.",
    adminMessage: err.message || "Unknown error",
    endpointPath,
    resolvedUrl,
    baseUrl,
    method,
    rawMessage: err.message || String(err),
    sessionId,
    requestId
  };


  // Case A: NETWORK_ERROR
  if (err.name === "TypeError" && (err.message.includes("fetch") || err.message.includes("NetworkError") || err.message.includes("Failed to fetch"))) {
    let subCode = "UNKNOWN_NETWORK";
    
    if (!window.navigator.onLine) {
      subCode = "OFFLINE";
    } else if (err.message.includes("CORS")) {
      subCode = "CORS_BLOCKED";
    } else if (err.stack?.includes("SSL") || err.message.includes("SSL")) {
      subCode = "SSL_ERROR";
    }

    normalized = {
      ...normalized,
      code: "NETWORK_ERROR",
      userMessage: "Não foi possível alcançar o servidor de conexão. Verifique internet/configuração.",
      adminMessage: `Network Failure (${subCode}): ${err.message}.`,
      rawMessage: `${subCode}: ${err.message}`
    };
  } 
  // Case B & C: Check if we have a response object (backend error)
  else if (err.status || (err instanceof Response)) {
    const status = err.status;
    normalized.httpStatus = status;

    if (status >= 400) {
      normalized.code = "BACKEND_HTTP_ERROR";
      normalized.userMessage = "Servidor de conexão indisponível no momento.";
      
      try {
        const body = typeof err.json === 'function' ? await err.json() : {};
        normalized.adminMessage = `Backend returned ${status}: ${JSON.stringify(body)}`;
        
        // Case C: PROVIDER_CONNECTION_ERROR (Check specific provider fields in body)
        if (body.providerStatusCode || body.backendReason === "405" || body.status === "desconectado") {
          normalized.code = "PROVIDER_CONNECTION_ERROR";
          normalized.userMessage = "Não foi possível gerar QR agora. Tente novamente em instantes.";
          normalized.providerStatusCode = body.providerStatusCode || (body.backendReason ? parseInt(body.backendReason) : undefined);
          normalized.providerReason = body.providerReason || body.reason;
          normalized.adminMessage = `Provider rejected connection: ${normalized.providerStatusCode} - ${normalized.providerReason}`;
        }
      } catch (e) {
        normalized.adminMessage = `Backend returned ${status} but body was unparseable.`;
      }
    }
  }

  // Persist to observability
  logger.error({
    event: "connect_error",
    sessionId,
    agentId,
    requestId,
    errorCode: normalized.code,
    errorMessage: normalized.adminMessage,
    status: normalized.httpStatus?.toString(),
    durationMs: elapsedMs,
    metadata: {
      endpointPath,
      resolvedUrl,
      method,
      attempt,
      userMessage: normalized.userMessage,
      providerStatusCode: normalized.providerStatusCode,
      providerReason: normalized.providerReason
    }
  });

  return normalized;
}
