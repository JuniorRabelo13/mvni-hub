-- 1. Criar tabela de logs de execução RPC
CREATE TABLE IF NOT EXISTS public.rpc_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    function_name text NOT NULL,
    status text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Indexar para auditoria rápida
CREATE INDEX IF NOT EXISTS idx_rpc_logs_user_fn ON public.rpc_logs (user_id, function_name);

-- 2. Habilitar RLS
ALTER TABLE public.rpc_logs ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de RLS
CREATE POLICY "Usuários veem seus próprios logs"
ON public.rpc_logs FOR SELECT
USING (auth.uid() = user_id);

-- 4. Função auxiliar de log (Internal)
CREATE OR REPLACE FUNCTION public.log_rpc_call(p_user_id uuid, p_function_name text, p_status text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.rpc_logs (user_id, function_name, status)
    VALUES (p_user_id, p_function_name, p_status);
END;
$$;

-- 5. Atualizar funções com logging

CREATE OR REPLACE FUNCTION public.claim_next_import_chunk()
RETURNS public.import_chunks
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_chunk public.import_chunks;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Não autorizado';
    END IF;

    PERFORM public.check_rpc_rate_limit(auth.uid(), 'claim_next_import_chunk');
    PERFORM public.log_rpc_call(auth.uid(), 'claim_next_import_chunk', 'success');

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
        FOR UPDATE SKIP LOCKED
        LIMIT 1
    )
    RETURNING c.* INTO v_chunk;

    RETURN v_chunk;
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_import_job(p_job_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Não autorizado';
    END IF;

    PERFORM public.check_rpc_rate_limit(auth.uid(), 'cancel_import_job');
    PERFORM public.log_rpc_call(auth.uid(), 'cancel_import_job', 'success');

    UPDATE public.import_jobs
    SET cancelado = true,
        status = 'canceled',
        updated_at = now()
    WHERE id = p_job_id 
    AND user_id = auth.uid();

    IF FOUND THEN
        UPDATE public.import_chunks
        SET status = 'canceled'
        WHERE job_id = p_job_id
        AND status IN ('pending', 'processing');
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.resume_import_job(p_job_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Não autorizado';
    END IF;

    PERFORM public.check_rpc_rate_limit(auth.uid(), 'resume_import_job');
    PERFORM public.log_rpc_call(auth.uid(), 'resume_import_job', 'success');

    UPDATE public.import_jobs
    SET cancelado = false,
        status = 'processing',
        updated_at = now()
    WHERE id = p_job_id
    AND user_id = auth.uid();

    IF FOUND THEN
        UPDATE public.import_chunks
        SET status = 'pending',
        tentativas = 0,
        proxima_tentativa = now()
        WHERE job_id = p_job_id
        AND status IN ('failed', 'canceled')
        AND tentativas < 3;
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_import_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Não autorizado';
    END IF;

    PERFORM public.check_rpc_rate_limit(auth.uid(), 'cleanup_import_data');
    PERFORM public.log_rpc_call(auth.uid(), 'cleanup_import_data', 'success');

    DELETE FROM public.import_chunks
    WHERE status = 'done'
    AND updated_at < now() - interval '7 days';

    DELETE FROM public.import_logs
    WHERE created_at < now() - interval '15 days';
END;
$$;

CREATE OR REPLACE FUNCTION public.get_import_errors(p_job_id uuid)
RETURNS TABLE (
    cnpj text,
    erro text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Não autorizado';
    END IF;

    PERFORM public.log_rpc_call(auth.uid(), 'get_import_errors', 'success');

    RETURN QUERY
    SELECT l.cnpj, l.erro
    FROM public.import_logs l
    INNER JOIN public.import_jobs j ON l.job_id = j.id
    WHERE l.job_id = p_job_id
    AND j.user_id = auth.uid()
    ORDER BY l.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_job_progress(p_job_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Não autorizado';
    END IF;

    PERFORM public.log_rpc_call(auth.uid(), 'increment_job_progress', 'success');

    UPDATE public.import_jobs
    SET linhas_processadas = linhas_processadas + 1,
        status = CASE 
            WHEN linhas_processadas + 1 >= total_linhas THEN 'done'
            ELSE 'processing'
        END,
        updated_at = now()
    WHERE id = p_job_id
    AND user_id = auth.uid();
END;
$$;
