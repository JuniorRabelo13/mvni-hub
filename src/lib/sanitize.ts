import { supabase } from "@/integrations/supabase/client";

/**
 * Camada de sanitização para dados retornados ao frontend.
 */

const SENSITIVE_KEY_PATTERNS = [
  /password/i,
  /senha/i,
  /token/i,
  /secret/i,
  /api[_-]?key/i,
  /access[_-]?key/i,
  /private[_-]?key/i,
  /service[_-]?role/i,
  /webhook[_-]?secret/i,
  /jwt/i,
  /refresh[_-]?token/i,
  /sk_[live|test]/i,
  /rk_[live|test]/i,
  /pk_[live|test]/i,
  /client[_-]?secret/i,
  /bearer/i,
  /authorization/i,
];

// Padrões de valores que parecem tokens ou chaves
const VALUE_PATTERNS = [
  /sk_(live|test)_[a-zA-Z0-9]{16,}/,
  /rk_(live|test)_[a-zA-Z0-9]{16,}/,
  /pk_(live|test)_[a-zA-Z0-9]{16,}/,
  /bearer\s+[a-zA-Z0-9-._~+/]+=*/i,
  /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9-_]+$/, // JWT
];

export function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY_PATTERNS.some((re) => re.test(key));
}

export function isSensitiveValue(val: any): boolean {
  if (typeof val !== "string") return false;
  return VALUE_PATTERNS.some((re) => re.test(val));
}

/**
 * Aplica máscara em strings sensíveis
 * Ex: "sk_live_abc123" -> "sk_l****c123"
 */
function maskValue(val: any): string | null {
  if (typeof val !== "string") return null;
  if (val.length <= 4) return "****";
  // Manter últimos 3-4 chars conforme solicitado
  const maskLength = Math.max(0, val.length - 4);
  return `${"*".repeat(4)}${val.slice(-4)}`;
}

/**
 * Gera um hash SHA-256 de um valor para log seguro (sem PII)
 */
async function generateHash(value: any): Promise<string> {
  const msgUint8 = new TextEncoder().encode(JSON.stringify(value));
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Registra uma detecção de segurança no banco usando a função RPC segura
 */
async function logSecurityDetection(userId: string | undefined, field: string, origin: string, payload?: any) {
  if (!userId) return;
  try {
    const hash = await generateHash(payload || field);
    await supabase.rpc("log_security_event", {
      p_user: userId,
      p_campo: field,
      p_origem: origin,
      p_hash: hash,
    });
  } catch (e) {
    console.error("Failed to log security detection", e);
  }
}

/**
 * Remove recursivamente campos sensíveis e aplica máscaras.
 */
export function sanitize<T>(data: T, origin: string = "frontend_sanitize", userId?: string): T {
  if (data == null) return data;
  
  if (Array.isArray(data)) {
    return data.map((item) => sanitize(item, origin, userId)) as unknown as T;
  }
  
  if (typeof data === "object") {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(data as Record<string, any>)) {
      // 1. Validar pela chave
      if (isSensitiveKey(k)) {
        if (v !== null) {
          logSecurityDetection(userId, k, origin, v);
          out[k] = maskValue(v);
        } else {
          out[k] = null;
        }
        continue;
      }
      
      // 2. Validar pelo valor (se for string)
      if (typeof v === "string" && isSensitiveValue(v)) {
         logSecurityDetection(userId, `${k} (value pattern)`, origin, v);
         out[k] = maskValue(v);
         continue;
      }

      out[k] = sanitize(v, origin, userId);
    }
    return out as T;
  }
  return data;
}

export function sanitizeConfiguracoes<T extends { chave: string, valor: any }>(rows: T[], userId?: string): T[] {
  return rows.map((r) => {
    if (isSensitiveKey(r.chave)) {
      return { ...r, valor: maskValue(r.valor) };
    }
    return r;
  });
}
