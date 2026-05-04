/**
 * Camada de sanitização para dados retornados ao frontend.
 *
 * Usada principalmente no modo "Ver como usuário", onde um admin
 * navega como outro usuário. Mesmo que o RLS permita ao admin ver
 * tudo, nunca devemos vazar campos sensíveis na UI.
 *
 * Regra: NUNCA retornar senhas, tokens, secrets ou chaves de API.
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
];

/** Chaves específicas de configurações que nunca devem aparecer no modo view-as. */
const SENSITIVE_CONFIG_KEYS = new Set([
  "asaas_api_key",
]);

export function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY_PATTERNS.some((re) => re.test(key));
}

export function isSensitiveConfigChave(chave: string): boolean {
  return SENSITIVE_CONFIG_KEYS.has(chave) || isSensitiveKey(chave);
}

/**
 * Remove recursivamente quaisquer campos cujo nome bata com padrões sensíveis.
 * Substitui o valor por null para não quebrar componentes que esperam a chave.
 */
export function sanitize<T>(data: T): T {
  if (data == null) return data;
  if (Array.isArray(data)) {
    return data.map((item) => sanitize(item)) as unknown as T;
  }
  if (typeof data === "object") {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(data as Record<string, any>)) {
      if (isSensitiveKey(k)) {
        out[k] = null;
        continue;
      }
      out[k] = sanitize(v);
    }
    return out as T;
  }
  return data;
}

/** Filtra uma lista de configurações removendo entradas sensíveis. */
export function sanitizeConfiguracoes<T extends { chave: string }>(rows: T[]): T[] {
  return rows
    .filter((r) => !isSensitiveConfigChave(r.chave))
    .map((r) => sanitize(r));
}
