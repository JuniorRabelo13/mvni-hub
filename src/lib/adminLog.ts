import { supabase } from "@/integrations/supabase/client";

export type AdminAction =
  | "ver_como_usuario"
  | "criar_usuario"
  | "alterar_role"
  | "alterar_config";

export async function logAdminAction(
  action: AdminAction,
  targetUserId?: string | null,
  metadata: Record<string, any> = {},
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("admin_logs").insert({
      admin_id: user.id,
      action,
      target_user_id: targetUserId ?? null,
      metadata,
    });
  } catch (e) {
    console.error("Falha ao registrar log admin:", e);
  }
}
