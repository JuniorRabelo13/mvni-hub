-- Substitui a política permissiva atual por uma que oculta chaves sensíveis
DROP POLICY IF EXISTS "Anyone can view settings" ON public.configuracoes;

CREATE POLICY "Authenticated can view non-sensitive settings"
ON public.configuracoes FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR chave NOT IN ('asaas_api_key')
);