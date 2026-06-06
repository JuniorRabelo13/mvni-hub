// Shared auth helpers for edge functions.
// Centralizes JWT validation, role checks and cron/internal secret validation.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export type AuthUser = { id: string; email?: string | null };

export async function getUserFromRequest(req: Request): Promise<AuthUser | null> {
  const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
  if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) return null;
  const token = authHeader.slice(7).trim();
  if (!token) return null;
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    );
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return null;
    return { id: data.user.id, email: data.user.email };
  } catch {
    return null;
  }
}

export async function userHasRole(userId: string, roles: string[]): Promise<boolean> {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .in("role", roles);
    return Array.isArray(data) && data.length > 0;
  } catch {
    return false;
  }
}

export function hasCronSecret(req: Request): boolean {
  const secret = Deno.env.get("CRON_SECRET");
  if (!secret) return false;
  const header =
    req.headers.get("X-Cron-Secret") ||
    req.headers.get("x-cron-secret") ||
    req.headers.get("X-Worker-Secret") ||
    req.headers.get("x-worker-secret");
  return !!header && header === secret;
}

export function hasInternalSecret(req: Request): boolean {
  const secret = Deno.env.get("INTERNAL_FUNCTION_SECRET") || Deno.env.get("CRON_SECRET");
  if (!secret) return false;
  const header =
    req.headers.get("X-Internal-Secret") ||
    req.headers.get("x-internal-secret") ||
    req.headers.get("X-Cron-Secret") ||
    req.headers.get("x-cron-secret");
  return !!header && header === secret;
}

const jsonHeaders = { "Content-Type": "application/json" };

export function unauthorized(message = "Unauthorized"): Response {
  return new Response(JSON.stringify({ error: message }), { status: 401, headers: jsonHeaders });
}

export function forbidden(message = "Forbidden"): Response {
  return new Response(JSON.stringify({ error: message }), { status: 403, headers: jsonHeaders });
}

/**
 * Require authenticated user. Returns user or a Response to short-circuit.
 */
export async function requireUser(req: Request): Promise<{ user: AuthUser | null; response: Response | null }> {
  const user = await getUserFromRequest(req);
  if (!user) return { user: null, response: unauthorized() };
  return { user, response: null };
}

/**
 * Require authenticated user with at least one of the given roles.
 */
export async function requireRole(
  req: Request,
  roles: string[],
): Promise<{ user: AuthUser | null; response: Response | null }> {
  const { user, response } = await requireUser(req);
  if (!user) return { user: null, response };
  const ok = await userHasRole(user.id, roles);
  if (!ok) return { user: null, response: forbidden("Insufficient role") };
  return { user, response: null };
}

/**
 * Allow either a valid cron/internal shared secret OR an admin/master_admin JWT.
 * Suitable for scheduled workers that may also be triggered manually by admins.
 */
export async function requireCronOrAdmin(req: Request): Promise<Response | null> {
  if (hasCronSecret(req)) return null;
  const { response } = await requireRole(req, ["admin", "master_admin"]);
  return response;
}
