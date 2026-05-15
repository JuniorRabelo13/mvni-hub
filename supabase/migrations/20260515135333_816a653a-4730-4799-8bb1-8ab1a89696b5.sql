CREATE OR REPLACE FUNCTION public.increment_job_progress_batch(p_job_id uuid, p_amount integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.import_jobs
    SET linhas_processadas = linhas_processadas + p_amount,
        status = CASE 
            WHEN linhas_processadas + p_amount >= total_linhas THEN 'done'
            ELSE 'processing'
        END,
        updated_at = now()
    WHERE id = p_job_id;
END;
$$;