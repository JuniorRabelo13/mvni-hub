CREATE OR REPLACE FUNCTION public.increment_job_progress(p_job_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
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
