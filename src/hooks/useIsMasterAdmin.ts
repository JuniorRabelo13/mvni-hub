import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useIsMasterAdmin() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["is-master-admin", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "master_admin")
        .maybeSingle();
      
      if (error) return false;
      return !!data;
    },
    enabled: !!user,
  });
}
