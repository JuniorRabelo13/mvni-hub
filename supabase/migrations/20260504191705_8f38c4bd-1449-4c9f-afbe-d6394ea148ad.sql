-- 1. Melhorar privacidade da tabela profiles
DROP POLICY IF EXISTS "profiles_read_authenticated" ON public.profiles;

CREATE POLICY "profiles_read_network"
ON public.profiles FOR SELECT
TO authenticated
USING (
    auth.uid() = id -- Próprio usuário
    OR indicador_id = auth.uid() -- Seus indicados diretos
    OR gestor_id = auth.uid() -- Sua equipe direta
    OR has_role(auth.uid(), 'admin'::app_role) -- Admins veem tudo
);

-- 2. Índice para performance de busca na rede
CREATE INDEX IF NOT EXISTS idx_profiles_indicador_id ON public.profiles(indicador_id);
CREATE INDEX IF NOT EXISTS idx_profiles_gestor_id ON public.profiles(gestor_id);

-- 3. Revogar execução pública de funções críticas novas
REVOKE EXECUTE ON FUNCTION public.sync_profile_role() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sms_deduct_credits(uuid, integer) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.sync_profile_role() TO service_role; -- Apenas gatilhos
GRANT EXECUTE ON FUNCTION public.sms_deduct_credits(uuid, integer) TO authenticated;
