-- 1. Criar tabela de controle de uso para rate limit
CREATE TABLE IF NOT EXISTS public.rpc_usage_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    function_name text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Indexar para buscas rápidas de contagem por tempo
CREATE INDEX IF NOT EXISTS idx_rpc_usage_user_time ON public.rpc_usage_logs (user_id, created_at);

-- 2. Função auxiliar de verificação de rate limit
CREATE OR REPLACE FUNCTION public.check_rpc_rate_limit(p_user_id uuid, p_function_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count integer;
BEGIN
    -- Limpar logs antigos (> 1 minuto) para manter a tabela leve
    DELETE FROM public.rpc_usage_logs WHERE created_at < now() - interval '1 minute';

    -- Contar chamadas no último minuto
    SELECT count(*) INTO v_count
    FROM public.rpc_usage_logs
    WHERE user_id = p_user_id
    AND created_at > now() - interval '1 minute';

    IF v_count >= 100 THEN
        RAISE EXCEPTION 'Rate limit excedido (máximo 100 chamadas/min). Tente novamente em breve.';
    END IF;

    -- Registrar uso
    INSERT INTO public.rpc_usage_logs (user_id, function_name)
    VALUES (p_user_id, p_function_name);
END;
$$;

-- 3. Aplicar rate limit nas funções críticas

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

    -- Aplicar Rate Limit
    PERFORM public.check_rpc_rate_limit(auth.uid(), 'claim_next_import_chunk');

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

    -- Aplicar Rate Limit
    PERFORM public.check_rpc_rate_limit(auth.uid(), 'cancel_import_job');

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

    -- Aplicar Rate Limit
    PERFORM public.check_rpc_rate_limit(auth.uid(), 'resume_import_job');

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

    -- Aplicar Rate Limit
    PERFORM public.check_rpc_rate_limit(auth.uid(), 'cleanup_import_data');

    DELETE FROM public.import_chunks
    WHERE status = 'done'
    AND updated_at < now() - interval '7 days';

    DELETE FROM public.import_logs
    WHERE created_at < now() - interval '15 days';
END;
$$;
