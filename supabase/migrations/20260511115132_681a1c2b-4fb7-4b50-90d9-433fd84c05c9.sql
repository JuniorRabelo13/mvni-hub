CREATE OR REPLACE FUNCTION public.get_master_affiliates_report()
RETURNS TABLE (
    affiliate_id UUID,
    affiliate_name TEXT,
    affiliate_email TEXT,
    total_clients BIGINT,
    total_revenue NUMERIC,
    monthly_recurring NUMERIC,
    overdue_count BIGINT,
    overdue_rate NUMERIC,
    churn_count BIGINT,
    churn_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH affiliate_metrics AS (
        SELECT 
            p.id as aid,
            p.display_name,
            p.email,
            COUNT(c.id) as client_count,
            COALESCE(SUM(com.valor), 0) as rev,
            -- MRR: 20 por linha ativa
            (SELECT COALESCE(COUNT(l.id) * 20.0, 0) 
             FROM public.linhas l 
             JOIN public.clientes cl ON l.cliente_id = cl.id 
             WHERE cl.user_id = p.id AND l.status = 'ativa') as mrr,
            -- Inadimplência: Clientes inativos ou linhas bloqueadas (simplificado)
            COUNT(c.id) FILTER (WHERE c.ativo = false) as overdue_pts,
            -- Churn: Clientes deletados ou status específico se existir
            0::BIGINT as churn_pts -- Fallback pois não há coluna de churn explícita
        FROM 
            public.profiles p
        LEFT JOIN 
            public.clientes c ON c.user_id = p.id
        LEFT JOIN 
            public.comissoes com ON com.user_id = p.id
        GROUP BY 
            p.id, p.display_name, p.email
    )
    SELECT 
        aid,
        COALESCE(display_name, 'Sem Nome'),
        COALESCE(email, 'Sem Email'),
        client_count,
        rev,
        mrr,
        overdue_pts,
        CASE WHEN client_count > 0 THEN ROUND((overdue_pts::numeric / client_count::numeric) * 100, 2) ELSE 0 END,
        churn_pts,
        CASE WHEN client_count > 0 THEN ROUND((churn_pts::numeric / client_count::numeric) * 100, 2) ELSE 0 END
    FROM 
        affiliate_metrics
    ORDER BY 
        rev DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;