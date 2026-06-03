
-- Enum para status do lead no funil
DO $$ BEGIN
  CREATE TYPE public.crm_lead_status AS ENUM ('novo', 'em_contato', 'em_negociacao', 'convertido', 'perdido');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.crm_interaction_type AS ENUM ('ligacao', 'mensagem', 'reuniao', 'email', 'nota', 'outro');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Tabela de leads
CREATE TABLE IF NOT EXISTS public.crm_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  telefone text,
  email text,
  origem text,
  status public.crm_lead_status NOT NULL DEFAULT 'novo',
  valor_mensal_estimado numeric(10,2) DEFAULT 99.90,
  comissao_ativacao_estimada numeric(10,2) DEFAULT 85.00,
  comissao_recorrente_estimada numeric(10,2) DEFAULT 20.00,
  proximo_contato_em timestamptz,
  observacao text,
  cliente_id uuid,
  convertido_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_leads TO authenticated;
GRANT ALL ON public.crm_leads TO service_role;

ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm_leads_owner_select" ON public.crm_leads
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_master_admin(auth.uid()) OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "crm_leads_owner_insert" ON public.crm_leads
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "crm_leads_owner_update" ON public.crm_leads
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_master_admin(auth.uid()))
  WITH CHECK (user_id = auth.uid() OR public.is_master_admin(auth.uid()));

CREATE POLICY "crm_leads_owner_delete" ON public.crm_leads
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_master_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_crm_leads_user_status ON public.crm_leads(user_id, status);
CREATE INDEX IF NOT EXISTS idx_crm_leads_proximo_contato ON public.crm_leads(user_id, proximo_contato_em);

-- Tabela de interações
CREATE TABLE IF NOT EXISTS public.crm_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.crm_leads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo public.crm_interaction_type NOT NULL DEFAULT 'nota',
  descricao text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_interactions TO authenticated;
GRANT ALL ON public.crm_interactions TO service_role;

ALTER TABLE public.crm_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm_interactions_owner_select" ON public.crm_interactions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_master_admin(auth.uid()) OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "crm_interactions_owner_insert" ON public.crm_interactions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "crm_interactions_owner_update" ON public.crm_interactions
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "crm_interactions_owner_delete" ON public.crm_interactions
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_master_admin(auth.uid()));

CREATE INDEX IF NOT EXISTS idx_crm_interactions_lead ON public.crm_interactions(lead_id, created_at DESC);

-- Trigger updated_at
DROP TRIGGER IF EXISTS trg_crm_leads_updated_at ON public.crm_leads;
CREATE TRIGGER trg_crm_leads_updated_at
  BEFORE UPDATE ON public.crm_leads
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
