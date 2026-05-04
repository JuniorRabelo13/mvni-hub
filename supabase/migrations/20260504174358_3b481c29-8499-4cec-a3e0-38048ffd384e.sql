-- 0. Criar tabelas base se não existirem
CREATE TABLE IF NOT EXISTS public.import_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, done, canceled, failed
    total_linhas INTEGER DEFAULT 0,
    linhas_processadas INTEGER DEFAULT 0,
    user_id UUID REFERENCES auth.users(id),
    cancelado BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.import_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES public.import_jobs(id) ON DELETE CASCADE,
    payload JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, done, failed, canceled
    tentativas INTEGER DEFAULT 0,
    proxima_tentativa TIMESTAMPTZ,
    erro TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.import_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES public.import_jobs(id) ON DELETE CASCADE,
    cnpj TEXT,
    erro TEXT,
    payload JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.import_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_logs ENABLE ROW LEVEL SECURITY;

-- Políticas (Apenas Admin)
CREATE POLICY "Admins can manage import_jobs" ON public.import_jobs
    FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can manage import_chunks" ON public.import_chunks
    FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can manage import_logs" ON public.import_logs
    FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- ETAPA 1 — CANCELAMENTO DE JOB
-- (Campo cancelado já adicionado no CREATE TABLE acima para garantir consistência)

CREATE OR REPLACE FUNCTION public.cancel_import_job(p_job_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.import_jobs
    SET cancelado = true,
        status = 'canceled',
        updated_at = now()
    WHERE id = p_job_id;

    UPDATE public.import_chunks
    SET status = 'canceled'
    WHERE job_id = p_job_id
    AND status IN ('pending', 'processing');
END;
$$;

-- ETAPA 2 & 4 — REIVINDICAR CHUNK & RETRY COM BACKOFF
CREATE OR REPLACE FUNCTION public.claim_next_import_chunk()
RETURNS public.import_chunks
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_chunk public.import_chunks;
BEGIN
    UPDATE public.import_chunks c
    SET status = 'processing',
        updated_at = now()
    FROM public.import_jobs j
    WHERE c.id = (
        SELECT c2.id
        FROM public.import_chunks c2
        JOIN public.import_jobs j2 ON c2.job_id = j2.id
        WHERE c2.status = 'pending'
        AND j2.cancelado = false
        AND j2.status = 'processing'
        AND (c2.proxima_tentativa IS NULL OR c2.proxima_tentativa <= now())
        AND c2.tentativas < 3
        ORDER BY c2.created_at ASC
        FOR UPDATE SKIP LOCKED
        LIMIT 1
    )
    AND c.job_id = j.id
    RETURNING c.* INTO v_chunk;

    RETURN v_chunk;
END;
$$;

-- Função auxiliar para registrar falha com backoff
CREATE OR REPLACE FUNCTION public.fail_import_chunk(p_chunk_id uuid, p_erro text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tentativas integer;
    v_delay interval;
BEGIN
    SELECT tentativas + 1 INTO v_tentativas
    FROM public.import_chunks
    WHERE id = p_chunk_id;

    v_delay := CASE 
        WHEN v_tentativas = 1 THEN interval '30 seconds'
        WHEN v_tentativas = 2 THEN interval '2 minutes'
        ELSE interval '10 minutes'
    END;

    UPDATE public.import_chunks
    SET status = CASE WHEN v_tentativas >= 3 THEN 'failed' ELSE 'pending' END,
        tentativas = v_tentativas,
        proxima_tentativa = now() + v_delay,
        erro = p_erro,
        updated_at = now()
    WHERE id = p_chunk_id;
END;
$$;

-- ETAPA 3 — RELATÓRIO DE ERROS
CREATE OR REPLACE FUNCTION public.get_import_errors(p_job_id uuid)
RETURNS TABLE (
    cnpj text,
    erro text,
    payload jsonb
)
LANGUAGE sql
SECURITY DEFINER
AS $$
    SELECT cnpj, erro, payload
    FROM public.import_logs
    WHERE job_id = p_job_id
    ORDER BY created_at DESC;
$$;

-- ETAPA 4 — RETOMADA SEGURA
CREATE OR REPLACE FUNCTION public.resume_import_job(p_job_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.import_jobs
    SET cancelado = false,
        status = 'processing',
        updated_at = now()
    WHERE id = p_job_id;

    UPDATE public.import_chunks
    SET status = 'pending',
        tentativas = 0, -- Resetar para permitir novas tentativas
        proxima_tentativa = now()
    WHERE job_id = p_job_id
    AND status IN ('failed', 'canceled')
    AND tentativas < 3;
END;
$$;

-- ETAPA 5 — AUTO-CLEANUP
CREATE OR REPLACE FUNCTION public.cleanup_old_imports()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Deletar chunks concluídos há mais de 7 dias
    DELETE FROM public.import_chunks
    WHERE status = 'done'
    AND updated_at < now() - interval '7 days';

    -- Deletar logs antigos há mais de 15 dias
    DELETE FROM public.import_logs
    WHERE created_at < now() - interval '15 days';
END;
$$;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_import_jobs_updated_at
    BEFORE UPDATE ON public.import_jobs
    FOR EACH ROW
    EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TRIGGER update_import_chunks_updated_at
    BEFORE UPDATE ON public.import_chunks
    FOR EACH ROW
    EXECUTE FUNCTION public.tg_set_updated_at();
