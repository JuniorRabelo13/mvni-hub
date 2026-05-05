import { LogEntry, logger } from "./observability";

export type ErrorCode = "NETWORK_ERROR" | "BACKEND_HTTP_ERROR" | "PROVIDER_CONNECTION_ERROR" | "UNKNOWN_ERROR";

export interface NormalizedError {
  code: ErrorCode;
  userMessage: string;
  adminMessage: string;
  endpoint: string;
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
    endpoint: string;
    sessionId?: string;
    requestId?: string;
    agentId?: string;
    attempt?: number;
    startTime?: number;
  }
): Promise<NormalizedError> {
  const { endpoint, sessionId, requestId, agentId, attempt, startTime } = context;
  const elapsedMs = startTime ? Date.now() - startTime : undefined;
  
  let normalized: NormalizedError = {
    code: "UNKNOWN_ERROR",
    userMessage: "Ocorreu um erro inesperado. Tente novamente.",
    adminMessage: err.message || "Unknown error",
    endpoint,
    rawMessage: err.message || String(err),
    sessionId,
    requestId
  };

  // Case A: NETWORK_ERROR
  if (err.name === "TypeError" && (err.message.includes("fetch") || err.message.includes("NetworkError"))) {
    normalized = {
      ...normalized,
      code: "NETWORK_ERROR",
      userMessage: "Não foi possível alcançar o servidor de conexão. Verifique internet/configuração.",
      adminMessage: `Failed to fetch: ${err.message}. Possible CORS, DNS, SSL, or offline.`,
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
      endpoint,
      attempt,
      userMessage: normalized.userMessage,
      providerStatusCode: normalized.providerStatusCode,
      providerReason: normalized.providerReason
    }
  });

  return normalized;
}
