-- 1. Revogar acesso público global (Postgres permite PUBLIC por padrão)
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;

-- 2. Garantir permissões básicas para o esquema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- 3. Liberar funções utilitárias do sistema para funcionamento do app
-- has_role é usada em RLS, precisa ser acessível
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO anon;

-- tg_set_updated_at é usada em gatilhos
GRANT EXECUTE ON FUNCTION public.tg_set_updated_at() TO authenticated;
GRANT EXECUTE ON FUNCTION public.tg_set_updated_at() TO anon;

-- get_configuracoes_safe
GRANT EXECUTE ON FUNCTION public.get_configuracoes_safe() TO authenticated;

-- 4. Liberar funções do pipeline apenas para usuários autenticados
GRANT EXECUTE ON FUNCTION public.cancel_import_job(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_next_import_chunk() TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_import_data() TO authenticated;
GRANT EXECUTE ON FUNCTION public.fail_import_chunk(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_import_errors(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resume_import_job(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_job_progress(uuid) TO authenticated;

-- 5. Atualizar funções com verificação de auth.uid() para defesa em profundidade
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
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Não autorizado';
    END IF;

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

    DELETE FROM public.import_chunks
    WHERE status = 'done'
    AND updated_at < now() - interval '7 days';

    DELETE FROM public.import_logs
    WHERE created_at < now() - interval '15 days';
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
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Não autorizado';
    END IF;

    SELECT tentativas + 1 INTO v_tentativas
    FROM public.import_chunks
    WHERE id = p_chunk_id;

    v_delay := CASE 
        WHEN v_tentativas = 1 THEN interval '30 seconds'
        WHEN v_tentativas = 2 THEN interval '2 minutes'
        ELSE interval '10 minutes'
    END;

    UPDATE public.import_chunks
    SET status = 'failed',
        tentativas = v_tentativas,
        proxima_tentativa = now() + v_delay,
        updated_at = now()
    WHERE id = p_chunk_id;

    INSERT INTO public.import_logs (job_id, chunk_id, erro)
    SELECT job_id, id, p_erro
    FROM public.import_chunks
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
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Não autorizado';
    END IF;

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

    UPDATE public.import_jobs
    SET linhas_processadas = linhas_processadas + 1,
        status = CASE 
            WHEN linhas_processadas + 1 >= total_linhas THEN 'done'
            ELSE 'processing'
        END,
        updated_at = now()
    WHERE id = p_job_id;
END;
$$;
