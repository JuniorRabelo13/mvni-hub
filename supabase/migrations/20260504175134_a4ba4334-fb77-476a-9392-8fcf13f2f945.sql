-- ETAPA 5 — AUTO-CLEANUP
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

-- Ajustar retorno da função de erros (Etapa 2)
DROP FUNCTION IF EXISTS public.get_import_errors(uuid);

CREATE OR REPLACE FUNCTION public.get_import_errors(p_job_id uuid)
RETURNS TABLE (
    cnpj text,
    erro text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT cnpj, erro
    FROM public.import_logs
    WHERE job_id = p_job_id
    ORDER BY created_at DESC;
$$;
