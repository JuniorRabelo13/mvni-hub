-- 1. Atualizar enum de status de linha
ALTER TYPE public.linha_status ADD VALUE IF NOT EXISTS 'pending_activation';
ALTER TYPE public.linha_status ADD VALUE IF NOT EXISTS 'active';
ALTER TYPE public.linha_status ADD VALUE IF NOT EXISTS 'suspended';
ALTER TYPE public.linha_status ADD VALUE IF NOT EXISTS 'cancelled';
ALTER TYPE public.linha_status ADD VALUE IF NOT EXISTS 'blocked';
ALTER TYPE public.linha_status ADD VALUE IF NOT EXISTS 'inactive';

-- 2. Tabela de logs de provedores
CREATE TABLE IF NOT EXISTS public.telecom_provider_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    cliente_id UUID REFERENCES public.clientes(id),
    linha_id UUID REFERENCES public.linhas(id),
    provider TEXT NOT NULL,
    action TEXT NOT NULL,
    payload JSONB,
    response JSONB,
    success BOOLEAN DEFAULT false,
    error_message TEXT
);

-- 3. Tabela de fila de jobs
CREATE TABLE IF NOT EXISTS public.telecom_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    linha_id UUID REFERENCES public.linhas(id),
    action TEXT NOT NULL, -- 'activate', 'suspend', 'reactivate', 'check_status'
    status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    last_error TEXT,
    payload JSONB
);

CREATE INDEX IF NOT EXISTS idx_telecom_jobs_status ON public.telecom_jobs(status);

-- 4. Segurança RLS
ALTER TABLE public.telecom_provider_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telecom_jobs ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Master can view telecom logs') THEN
        CREATE POLICY "Master can view telecom logs" ON public.telecom_provider_logs
            FOR SELECT TO authenticated USING (
                EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND role IN ('master', 'master_admin'))
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Master can manage telecom jobs') THEN
        CREATE POLICY "Master can manage telecom jobs" ON public.telecom_jobs
            FOR ALL TO authenticated USING (
                EXISTS (SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND role IN ('master', 'master_admin'))
            );
    END IF;
END $$;

-- 5. Automação Financeira
CREATE OR REPLACE FUNCTION public.handle_financial_telecom_sync()
RETURNS TRIGGER AS $$
BEGIN
    -- Suspensão por inadimplência
    IF (NEW.status = 'inadimplente' AND (OLD.status IS NULL OR OLD.status != 'inadimplente')) THEN
        INSERT INTO public.telecom_jobs (linha_id, action, payload)
        SELECT id, 'suspend', jsonb_build_object('reason', 'financial_overdue')
        FROM public.linhas 
        WHERE cliente_id = NEW.cliente_id 
        AND (status = 'ativa' OR status = 'active');
    END IF;

    -- Reativação após pagamento
    IF (NEW.status = 'ativo' AND OLD.status = 'inadimplente') THEN
        INSERT INTO public.telecom_jobs (linha_id, action, payload)
        SELECT id, 'reactivate', jsonb_build_object('reason', 'financial_cleared')
        FROM public.linhas 
        WHERE cliente_id = NEW.cliente_id 
        AND (status = 'suspensa' OR status = 'suspended');
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_financial_telecom_sync ON public.assinaturas;
CREATE TRIGGER tr_financial_telecom_sync
AFTER UPDATE ON public.assinaturas
FOR EACH ROW
EXECUTE FUNCTION public.handle_financial_telecom_sync();
