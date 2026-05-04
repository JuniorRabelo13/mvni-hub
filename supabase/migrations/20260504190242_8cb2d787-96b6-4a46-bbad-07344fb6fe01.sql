-- 1. Atualizar cancel_import_job para validar propriedade
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

    -- Só atualiza se o job pertencer ao usuário autenticado
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

-- 2. Atualizar resume_import_job para validar propriedade
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

    -- Só atualiza se o job pertencer ao usuário autenticado
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

-- 3. Atualizar get_import_errors para filtrar por usuário (via join com import_jobs)
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

    RETURN QUERY
    SELECT l.cnpj, l.erro
    FROM public.import_logs l
    INNER JOIN public.import_jobs j ON l.job_id = j.id
    WHERE l.job_id = p_job_id
    AND j.user_id = auth.uid()
    ORDER BY l.created_at DESC;
END;
$$;

-- 4. Atualizar increment_job_progress para validar propriedade
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
    WHERE id = p_job_id
    AND user_id = auth.uid();
END;
$$;
