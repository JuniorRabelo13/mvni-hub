-- Enum de status
DO $$ BEGIN
  CREATE TYPE public.mvno_pagamento_status AS ENUM ('pendente','confirmado','expirado','cancelado','falhou');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 1) Tabela
CREATE TABLE IF NOT EXISTS public.mvno_pagamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fatura_id UUID NOT NULL REFERENCES public.mvno_faturas(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  linha_id UUID REFERENCES public.mvno_linhas(id) ON DELETE SET NULL,
  provider TEXT NOT NULL DEFAULT 'stripe_pix',
  provider_intent_id TEXT UNIQUE,
  valor NUMERIC(12,2) NOT NULL CHECK (valor >= 0),
  status public.mvno_pagamento_status NOT NULL DEFAULT 'pendente',
  pix_qr_code_base64 TEXT,
  pix_copia_e_cola TEXT,
  expires_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mvno_pag_fatura ON public.mvno_pagamentos(fatura_id);
CREATE INDEX IF NOT EXISTS idx_mvno_pag_cliente ON public.mvno_pagamentos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_mvno_pag_status ON public.mvno_pagamentos(status);

-- 2) Grants
GRANT SELECT, INSERT, UPDATE ON public.mvno_pagamentos TO authenticated;
GRANT ALL ON public.mvno_pagamentos TO service_role;

-- 3) RLS
ALTER TABLE public.mvno_pagamentos ENABLE ROW LEVEL SECURITY;

-- 4) Policies
-- Cliente lê seus próprios pagamentos
CREATE POLICY "Cliente le seus pagamentos MVNO"
  ON public.mvno_pagamentos FOR SELECT
  TO authenticated
  USING (
    cliente_id IN (SELECT c.id FROM public.clientes c WHERE c.user_id = auth.uid())
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'master_admin'::app_role)
  );

-- Admins podem atualizar (marcar como cancelado manualmente, por exemplo)
CREATE POLICY "Admin gerencia pagamentos MVNO"
  ON public.mvno_pagamentos FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'master_admin'::app_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'master_admin'::app_role)
  );

-- Insert NÃO é permitido a authenticated; apenas edge functions (service_role) criam.
-- service_role tem GRANT ALL e bypass de RLS.

-- 5) Trigger updated_at
DROP TRIGGER IF EXISTS trg_mvno_pagamentos_updated_at ON public.mvno_pagamentos;
CREATE TRIGGER trg_mvno_pagamentos_updated_at
BEFORE UPDATE ON public.mvno_pagamentos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();