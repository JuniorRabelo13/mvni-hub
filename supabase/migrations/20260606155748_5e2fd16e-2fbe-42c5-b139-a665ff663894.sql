
-- 1) Coluna de marcação de cadastro pago em usuarios (não altera role/status)
ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS cadastro_pago_em timestamptz;

-- 2) Tabela de pagamentos do cadastro de representante
CREATE TABLE IF NOT EXISTS public.pagamentos_cadastro_representante (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_session_id text UNIQUE NOT NULL,
  stripe_payment_intent_id text,
  valor numeric(10,2),
  moeda text NOT NULL DEFAULT 'brl',
  status text NOT NULL DEFAULT 'pago',
  pago_em timestamptz NOT NULL DEFAULT now(),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3) Grants (Data API)
GRANT SELECT ON public.pagamentos_cadastro_representante TO authenticated;
GRANT ALL ON public.pagamentos_cadastro_representante TO service_role;

-- 4) RLS
ALTER TABLE public.pagamentos_cadastro_representante ENABLE ROW LEVEL SECURITY;

-- Usuário vê apenas os próprios pagamentos
CREATE POLICY "user can read own cadastro payment"
  ON public.pagamentos_cadastro_representante
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admin/master vê tudo (usa função existente public.has_role)
CREATE POLICY "admins can read all cadastro payments"
  ON public.pagamentos_cadastro_representante
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'master_admin'::app_role)
  );

-- (Sem políticas de INSERT/UPDATE/DELETE para authenticated → bloqueado.
--  service_role bypassa RLS e é o único que escreve, via edge function.)

-- 5) Índice auxiliar
CREATE INDEX IF NOT EXISTS idx_pag_cadastro_rep_user
  ON public.pagamentos_cadastro_representante(user_id);

-- 6) Trigger updated_at
CREATE OR REPLACE FUNCTION public.tg_pag_cadastro_rep_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_pag_cadastro_rep_updated_at
  ON public.pagamentos_cadastro_representante;

CREATE TRIGGER trg_pag_cadastro_rep_updated_at
  BEFORE UPDATE ON public.pagamentos_cadastro_representante
  FOR EACH ROW
  EXECUTE FUNCTION public.tg_pag_cadastro_rep_updated_at();
