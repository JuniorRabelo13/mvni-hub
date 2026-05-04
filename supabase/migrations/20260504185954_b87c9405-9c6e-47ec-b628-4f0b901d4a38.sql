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
    WHERE l.job_id = p_job_id
    ORDER BY l.created_at DESC;
END;
$$;
