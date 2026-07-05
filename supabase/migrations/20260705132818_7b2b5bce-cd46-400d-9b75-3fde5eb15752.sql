
-- =====================================================
-- SPRINT 1 MVNO — Fundação
-- =====================================================

-- ENUMS
CREATE TYPE public.mvno_linha_status AS ENUM ('ativa','suspensa','bloqueada','cancelada','portabilidade','em_ativacao');
CREATE TYPE public.mvno_fatura_status AS ENUM ('aberta','paga','atrasada','cancelada','contestada');
CREATE TYPE public.mvno_evento_tipo AS ENUM ('ativacao','suspensao','reativacao','troca_plano','pagamento','inadimplencia','cancelamento','portabilidade','importacao_fatura','alteracao_admin','criacao');
CREATE TYPE public.mvno_parser_status AS ENUM ('pending','processing','done','failed','pending_ai','canceled');
CREATE TYPE public.mvno_parser_tipo AS ENUM ('pdf','csv','xlsx','ocr');
CREATE TYPE public.mvno_item_categoria AS ENUM ('assinatura','dados','sms','ligacoes','roaming','servicos_adicionais','tributos','desconto','outros');

-- Helper: tenant_id atual (hoje NULL; troca sem migration para multi-tenant no futuro)
CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NULL::uuid;
$$;
REVOKE EXECUTE ON FUNCTION public.current_tenant_id() FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_tenant_id() TO authenticated, service_role;

-- =====================================================
-- OPERADORAS
-- =====================================================
CREATE TABLE public.operadoras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  slug text UNIQUE NOT NULL,
  cor text,
  logo_url text,
  ativo boolean NOT NULL DEFAULT true,
  tenant_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.operadoras TO authenticated;
GRANT ALL ON public.operadoras TO service_role;
ALTER TABLE public.operadoras ENABLE ROW LEVEL SECURITY;
CREATE POLICY operadoras_select_auth ON public.operadoras FOR SELECT TO authenticated USING (ativo = true OR has_role(auth.uid(),'admin') OR is_master_admin(auth.uid()));
CREATE POLICY operadoras_admin_all ON public.operadoras FOR ALL TO authenticated USING (has_role(auth.uid(),'admin') OR is_master_admin(auth.uid())) WITH CHECK (has_role(auth.uid(),'admin') OR is_master_admin(auth.uid()));
CREATE INDEX idx_operadoras_tenant ON public.operadoras(tenant_id);

-- =====================================================
-- PLANOS_MVNO
-- =====================================================
CREATE TABLE public.planos_mvno (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operadora_id uuid REFERENCES public.operadoras(id) ON DELETE SET NULL,
  nome text NOT NULL,
  descricao text,
  franquia_dados_mb integer NOT NULL DEFAULT 0,
  sms_incluidos integer NOT NULL DEFAULT 0,
  minutos_incluidos integer NOT NULL DEFAULT 0,
  valor_mensal numeric(12,2) NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  tenant_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.planos_mvno TO authenticated;
GRANT ALL ON public.planos_mvno TO service_role;
ALTER TABLE public.planos_mvno ENABLE ROW LEVEL SECURITY;
CREATE POLICY planos_mvno_select_auth ON public.planos_mvno FOR SELECT TO authenticated USING (ativo = true OR has_role(auth.uid(),'admin') OR is_master_admin(auth.uid()));
CREATE POLICY planos_mvno_admin_all ON public.planos_mvno FOR ALL TO authenticated USING (has_role(auth.uid(),'admin') OR is_master_admin(auth.uid())) WITH CHECK (has_role(auth.uid(),'admin') OR is_master_admin(auth.uid()));
CREATE INDEX idx_planos_mvno_operadora ON public.planos_mvno(operadora_id);
CREATE INDEX idx_planos_mvno_tenant ON public.planos_mvno(tenant_id);

-- =====================================================
-- MVNO_LINHAS
-- =====================================================
CREATE TABLE public.mvno_linhas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero text NOT NULL,
  iccid text,
  imsi text,
  operadora_id uuid REFERENCES public.operadoras(id) ON DELETE SET NULL,
  plano_id uuid REFERENCES public.planos_mvno(id) ON DELETE SET NULL,
  cliente_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL, -- representante responsável
  status public.mvno_linha_status NOT NULL DEFAULT 'em_ativacao',
  ativada_em timestamptz,
  proximo_vencimento date,
  valor_mensal numeric(12,2) NOT NULL DEFAULT 0,
  observacoes text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  tenant_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mvno_linhas TO authenticated;
GRANT ALL ON public.mvno_linhas TO service_role;
ALTER TABLE public.mvno_linhas ENABLE ROW LEVEL SECURITY;

-- Cliente final vê apenas suas linhas (via clientes.user_id)
CREATE POLICY mvno_linhas_cliente_select ON public.mvno_linhas FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.clientes c WHERE c.id = mvno_linhas.cliente_id AND c.user_id = auth.uid()));

-- Representante vê linhas que ele cadastrou
CREATE POLICY mvno_linhas_representante_select ON public.mvno_linhas FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Admin/Master total
CREATE POLICY mvno_linhas_admin_all ON public.mvno_linhas FOR ALL TO authenticated
USING (has_role(auth.uid(),'admin') OR is_master_admin(auth.uid()))
WITH CHECK (has_role(auth.uid(),'admin') OR is_master_admin(auth.uid()));

CREATE INDEX idx_mvno_linhas_cliente ON public.mvno_linhas(cliente_id);
CREATE INDEX idx_mvno_linhas_user ON public.mvno_linhas(user_id);
CREATE INDEX idx_mvno_linhas_status ON public.mvno_linhas(status);
CREATE INDEX idx_mvno_linhas_venc ON public.mvno_linhas(proximo_vencimento);
CREATE INDEX idx_mvno_linhas_tenant ON public.mvno_linhas(tenant_id);
CREATE UNIQUE INDEX idx_mvno_linhas_numero ON public.mvno_linhas(numero) WHERE numero IS NOT NULL;

-- =====================================================
-- MVNO_LINHA_HISTORICO
-- =====================================================
CREATE TABLE public.mvno_linha_historico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  linha_id uuid NOT NULL REFERENCES public.mvno_linhas(id) ON DELETE CASCADE,
  evento public.mvno_evento_tipo NOT NULL,
  descricao text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  tenant_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.mvno_linha_historico TO authenticated;
GRANT ALL ON public.mvno_linha_historico TO service_role;
ALTER TABLE public.mvno_linha_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY mvno_hist_cliente_select ON public.mvno_linha_historico FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.mvno_linhas l JOIN public.clientes c ON c.id = l.cliente_id
  WHERE l.id = mvno_linha_historico.linha_id AND c.user_id = auth.uid()
));
CREATE POLICY mvno_hist_representante_select ON public.mvno_linha_historico FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.mvno_linhas l WHERE l.id = mvno_linha_historico.linha_id AND l.user_id = auth.uid()));
CREATE POLICY mvno_hist_admin_all ON public.mvno_linha_historico FOR ALL TO authenticated
USING (has_role(auth.uid(),'admin') OR is_master_admin(auth.uid()))
WITH CHECK (has_role(auth.uid(),'admin') OR is_master_admin(auth.uid()));
CREATE INDEX idx_mvno_hist_linha ON public.mvno_linha_historico(linha_id, created_at DESC);

-- =====================================================
-- MVNO_FATURAS
-- =====================================================
CREATE TABLE public.mvno_faturas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  linha_id uuid NOT NULL REFERENCES public.mvno_linhas(id) ON DELETE CASCADE,
  cliente_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL,
  competencia date NOT NULL, -- yyyy-mm-01
  valor numeric(12,2) NOT NULL DEFAULT 0,
  vencimento date NOT NULL,
  pago_em timestamptz,
  status public.mvno_fatura_status NOT NULL DEFAULT 'aberta',
  pdf_path text, -- caminho no bucket privado
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  tenant_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(linha_id, competencia)
);
GRANT SELECT, INSERT, UPDATE ON public.mvno_faturas TO authenticated;
GRANT ALL ON public.mvno_faturas TO service_role;
ALTER TABLE public.mvno_faturas ENABLE ROW LEVEL SECURITY;

CREATE POLICY mvno_faturas_cliente_select ON public.mvno_faturas FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.clientes c WHERE c.id = mvno_faturas.cliente_id AND c.user_id = auth.uid()));
-- Representante NÃO vê faturas (dados financeiros de terceiros) — apenas admin/master
CREATE POLICY mvno_faturas_admin_all ON public.mvno_faturas FOR ALL TO authenticated
USING (has_role(auth.uid(),'admin') OR is_master_admin(auth.uid()))
WITH CHECK (has_role(auth.uid(),'admin') OR is_master_admin(auth.uid()));

CREATE INDEX idx_mvno_faturas_linha ON public.mvno_faturas(linha_id, competencia DESC);
CREATE INDEX idx_mvno_faturas_cliente ON public.mvno_faturas(cliente_id);
CREATE INDEX idx_mvno_faturas_status ON public.mvno_faturas(status, vencimento);
CREATE INDEX idx_mvno_faturas_tenant ON public.mvno_faturas(tenant_id);

-- =====================================================
-- MVNO_FATURA_ITENS
-- =====================================================
CREATE TABLE public.mvno_fatura_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fatura_id uuid NOT NULL REFERENCES public.mvno_faturas(id) ON DELETE CASCADE,
  descricao text NOT NULL,
  categoria public.mvno_item_categoria NOT NULL DEFAULT 'outros',
  quantidade numeric(12,3) NOT NULL DEFAULT 1,
  valor_unit numeric(12,4) NOT NULL DEFAULT 0,
  valor_total numeric(12,2) NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.mvno_fatura_itens TO authenticated;
GRANT ALL ON public.mvno_fatura_itens TO service_role;
ALTER TABLE public.mvno_fatura_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY mvno_fitens_cliente_select ON public.mvno_fatura_itens FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.mvno_faturas f JOIN public.clientes c ON c.id = f.cliente_id
  WHERE f.id = mvno_fatura_itens.fatura_id AND c.user_id = auth.uid()
));
CREATE POLICY mvno_fitens_admin_all ON public.mvno_fatura_itens FOR ALL TO authenticated
USING (has_role(auth.uid(),'admin') OR is_master_admin(auth.uid()))
WITH CHECK (has_role(auth.uid(),'admin') OR is_master_admin(auth.uid()));
CREATE INDEX idx_mvno_fitens_fatura ON public.mvno_fatura_itens(fatura_id);

-- =====================================================
-- MVNO_CONSUMOS
-- =====================================================
CREATE TABLE public.mvno_consumos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  linha_id uuid NOT NULL REFERENCES public.mvno_linhas(id) ON DELETE CASCADE,
  competencia date NOT NULL,
  dados_mb numeric(14,2) NOT NULL DEFAULT 0,
  sms_qtd integer NOT NULL DEFAULT 0,
  minutos_qtd integer NOT NULL DEFAULT 0,
  roaming_mb numeric(14,2) NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  tenant_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(linha_id, competencia)
);
GRANT SELECT, INSERT, UPDATE ON public.mvno_consumos TO authenticated;
GRANT ALL ON public.mvno_consumos TO service_role;
ALTER TABLE public.mvno_consumos ENABLE ROW LEVEL SECURITY;

CREATE POLICY mvno_consumos_cliente_select ON public.mvno_consumos FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.mvno_linhas l JOIN public.clientes c ON c.id = l.cliente_id
  WHERE l.id = mvno_consumos.linha_id AND c.user_id = auth.uid()
));
CREATE POLICY mvno_consumos_representante_select ON public.mvno_consumos FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.mvno_linhas l WHERE l.id = mvno_consumos.linha_id AND l.user_id = auth.uid()));
CREATE POLICY mvno_consumos_admin_all ON public.mvno_consumos FOR ALL TO authenticated
USING (has_role(auth.uid(),'admin') OR is_master_admin(auth.uid()))
WITH CHECK (has_role(auth.uid(),'admin') OR is_master_admin(auth.uid()));
CREATE INDEX idx_mvno_consumos_linha ON public.mvno_consumos(linha_id, competencia DESC);

-- =====================================================
-- MVNO_UPLOADS_FATURAS
-- =====================================================
CREATE TABLE public.mvno_uploads_faturas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uploader_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  operadora_id uuid REFERENCES public.operadoras(id) ON DELETE SET NULL,
  competencia date NOT NULL,
  arquivo_path text NOT NULL,
  mime text,
  size_bytes bigint,
  status public.mvno_parser_status NOT NULL DEFAULT 'pending',
  total_linhas integer NOT NULL DEFAULT 0,
  processadas integer NOT NULL DEFAULT 0,
  erros_count integer NOT NULL DEFAULT 0,
  observacoes text,
  tenant_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.mvno_uploads_faturas TO authenticated;
GRANT ALL ON public.mvno_uploads_faturas TO service_role;
ALTER TABLE public.mvno_uploads_faturas ENABLE ROW LEVEL SECURITY;
CREATE POLICY mvno_uploads_admin_all ON public.mvno_uploads_faturas FOR ALL TO authenticated
USING (has_role(auth.uid(),'admin') OR is_master_admin(auth.uid()))
WITH CHECK (has_role(auth.uid(),'admin') OR is_master_admin(auth.uid()));
CREATE INDEX idx_mvno_uploads_status ON public.mvno_uploads_faturas(status, created_at DESC);

-- =====================================================
-- MVNO_PARSER_JOBS
-- =====================================================
CREATE TABLE public.mvno_parser_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id uuid NOT NULL REFERENCES public.mvno_uploads_faturas(id) ON DELETE CASCADE,
  tipo public.mvno_parser_tipo NOT NULL,
  status public.mvno_parser_status NOT NULL DEFAULT 'pending',
  iniciado_em timestamptz,
  finalizado_em timestamptz,
  resultado jsonb NOT NULL DEFAULT '{}'::jsonb,
  erro text,
  tenant_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.mvno_parser_jobs TO authenticated;
GRANT ALL ON public.mvno_parser_jobs TO service_role;
ALTER TABLE public.mvno_parser_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY mvno_parser_jobs_admin_all ON public.mvno_parser_jobs FOR ALL TO authenticated
USING (has_role(auth.uid(),'admin') OR is_master_admin(auth.uid()))
WITH CHECK (has_role(auth.uid(),'admin') OR is_master_admin(auth.uid()));
CREATE INDEX idx_mvno_parser_jobs_upload ON public.mvno_parser_jobs(upload_id);
CREATE INDEX idx_mvno_parser_jobs_status ON public.mvno_parser_jobs(status);

-- =====================================================
-- MVNO_PARSER_LOGS
-- =====================================================
CREATE TABLE public.mvno_parser_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.mvno_parser_jobs(id) ON DELETE CASCADE,
  nivel text NOT NULL DEFAULT 'info', -- info, warn, error
  mensagem text NOT NULL,
  contexto jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.mvno_parser_logs TO authenticated;
GRANT ALL ON public.mvno_parser_logs TO service_role;
ALTER TABLE public.mvno_parser_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY mvno_parser_logs_admin_all ON public.mvno_parser_logs FOR ALL TO authenticated
USING (has_role(auth.uid(),'admin') OR is_master_admin(auth.uid()))
WITH CHECK (has_role(auth.uid(),'admin') OR is_master_admin(auth.uid()));
CREATE INDEX idx_mvno_parser_logs_job ON public.mvno_parser_logs(job_id, created_at);

-- =====================================================
-- MVNO_AUDIT_LOGS
-- =====================================================
CREATE TABLE public.mvno_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  entidade text NOT NULL,
  entidade_id uuid,
  acao text NOT NULL,
  antes jsonb,
  depois jsonb,
  ip text,
  user_agent text,
  tenant_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.mvno_audit_logs TO authenticated;
GRANT ALL ON public.mvno_audit_logs TO service_role;
ALTER TABLE public.mvno_audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY mvno_audit_logs_admin_select ON public.mvno_audit_logs FOR SELECT TO authenticated
USING (has_role(auth.uid(),'admin') OR is_master_admin(auth.uid()));
CREATE POLICY mvno_audit_logs_insert ON public.mvno_audit_logs FOR INSERT TO authenticated
WITH CHECK (actor_id = auth.uid() OR has_role(auth.uid(),'admin') OR is_master_admin(auth.uid()));
CREATE INDEX idx_mvno_audit_entidade ON public.mvno_audit_logs(entidade, entidade_id, created_at DESC);
CREATE INDEX idx_mvno_audit_actor ON public.mvno_audit_logs(actor_id, created_at DESC);

-- =====================================================
-- TRIGGERS updated_at
-- =====================================================
CREATE TRIGGER trg_operadoras_updated BEFORE UPDATE ON public.operadoras FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_planos_mvno_updated BEFORE UPDATE ON public.planos_mvno FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_mvno_linhas_updated BEFORE UPDATE ON public.mvno_linhas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_mvno_faturas_updated BEFORE UPDATE ON public.mvno_faturas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_mvno_consumos_updated BEFORE UPDATE ON public.mvno_consumos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_mvno_uploads_updated BEFORE UPDATE ON public.mvno_uploads_faturas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_mvno_parser_jobs_updated BEFORE UPDATE ON public.mvno_parser_jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- TRIGGER: histórico automático em mvno_linhas
-- =====================================================
CREATE OR REPLACE FUNCTION public.mvno_linhas_log_history()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.mvno_linha_historico(linha_id, evento, descricao, actor_id, metadata)
    VALUES (NEW.id, 'criacao', 'Linha criada', auth.uid(), jsonb_build_object('status', NEW.status));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      INSERT INTO public.mvno_linha_historico(linha_id, evento, descricao, actor_id, metadata)
      VALUES (
        NEW.id,
        CASE NEW.status
          WHEN 'ativa' THEN (CASE WHEN OLD.status='suspensa' THEN 'reativacao'::mvno_evento_tipo ELSE 'ativacao'::mvno_evento_tipo END)
          WHEN 'suspensa' THEN 'suspensao'::mvno_evento_tipo
          WHEN 'cancelada' THEN 'cancelamento'::mvno_evento_tipo
          WHEN 'portabilidade' THEN 'portabilidade'::mvno_evento_tipo
          ELSE 'alteracao_admin'::mvno_evento_tipo
        END,
        format('Status: %s -> %s', OLD.status, NEW.status),
        auth.uid(),
        jsonb_build_object('from', OLD.status, 'to', NEW.status)
      );
    END IF;
    IF NEW.plano_id IS DISTINCT FROM OLD.plano_id THEN
      INSERT INTO public.mvno_linha_historico(linha_id, evento, descricao, actor_id, metadata)
      VALUES (NEW.id, 'troca_plano', 'Plano alterado', auth.uid(),
        jsonb_build_object('from', OLD.plano_id, 'to', NEW.plano_id));
    END IF;
    RETURN NEW;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.mvno_linhas_log_history() FROM anon, PUBLIC;

CREATE TRIGGER trg_mvno_linhas_history
AFTER INSERT OR UPDATE ON public.mvno_linhas
FOR EACH ROW EXECUTE FUNCTION public.mvno_linhas_log_history();
