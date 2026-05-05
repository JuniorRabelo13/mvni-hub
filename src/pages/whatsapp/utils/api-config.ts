
export type ApiUrlError = "API_URL_INVALID";

export function getApiBaseUrl(): string {
  const url = import.meta.env.VITE_WHATSAPP_API_URL || "https://hmzqfcooxqucytxwljhg.supabase.co/functions/v1/whatsapp-api";
  
  if (!url || url.trim() === "") {
    const err = new Error("A variável VITE_WHATSAPP_API_URL não está configurada.");
    (err as any).code = "API_URL_INVALID";
    throw err;
  }

  try {
    const baseUrl = new URL(url);
    if (baseUrl.protocol !== "http:" && baseUrl.protocol !== "https:") {
      const err = new Error("A URL da API deve começar com http:// ou https://");
      (err as any).code = "API_URL_INVALID";
      throw err;
    }
    
    // Remove trailing slash
    return url.replace(/\/$/, "");
  } catch (e: any) {
    if (e.code === "API_URL_INVALID") throw e;
    const err = new Error("A URL configurada em VITE_WHATSAPP_API_URL é inválida.");
    (err as any).code = "API_URL_INVALID";
    throw err;
  }
}

export function buildApiUrl(path: string): string {
  const baseUrl = getApiBaseUrl();
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const resolvedUrl = `${baseUrl}${cleanPath}`;

  // Guardrail: Prova inequívoca de URL absoluta
  if (!resolvedUrl.startsWith("http://") && !resolvedUrl.startsWith("https://")) {
    const err = new Error(`Caminho absoluto obrigatório. Gerado: ${resolvedUrl}`);
    (err as any).code = "API_URL_INVALID";
    throw err;
  }

  return resolvedUrl;
}

