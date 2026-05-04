-- 1. Aplicar hardening em todas as funções de importação (search_path e segurança)

CREATE OR REPLACE FUNCTION public.cleanup_import_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    DELETE FROM public.import_chunks
    WHERE status = 'done'
    AND updated_at < now() - interval '7 days';

    DELETE FROM public.import_logs
    WHERE created_at < now() - interval '15 days';
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_import_job(p_job_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

CREATE OR REPLACE FUNCTION public.claim_next_import_chunk()
RETURNS public.import_chunks
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

CREATE OR REPLACE FUNCTION public.fail_import_chunk(p_chunk_id uuid, p_erro text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

CREATE OR REPLACE FUNCTION public.resume_import_job(p_job_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.import_jobs
    SET cancelado = false,
        status = 'processing',
        updated_at = now()
    WHERE id = p_job_id;

    UPDATE public.import_chunks
    SET status = 'pending',
        tentativas = 0,
        proxima_tentativa = now()
    WHERE job_id = p_job_id
    AND status IN ('failed', 'canceled')
    AND tentativas < 3;
END;
$$;

-- 2. Agendar Auto-Cleanup
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        PERFORM cron.schedule(
            'cleanup-import-data',
            '0 3 * * *',
            'SELECT public.cleanup_import_data();'
        );
    END IF;
END $$;

-- 3. Políticas RLS para papéis existentes (admin, user)
DROP POLICY IF EXISTS "Admins can manage import_jobs" ON public.import_jobs;
CREATE POLICY "Authorized users can manage import_jobs" ON public.import_jobs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );
