CREATE OR REPLACE FUNCTION public.get_master_lines_report()
RETURNS json AS $$
DECLARE
    v_ativas bigint;
    v_suspensas bigint;
    v_canceladas bigint;
    v_reativadas bigint;
    v_total bigint;
    v_lines_data json;
BEGIN
    -- Contagem por status
    SELECT COUNT(*) INTO v_ativas FROM public.linhas WHERE status = 'ativa';
    SELECT COUNT(*) INTO v_suspensas FROM public.linhas WHERE status = 'suspensa';
    SELECT COUNT(*) INTO v_canceladas FROM public.linhas WHERE status = 'cancelada';
    
    -- Reativadas (Simulando baseado em logs de histórico se existirem, ou count fixo de exemplo por enquanto)
    v_reativadas := 0; 
    v_total := v_ativas + v_suspensas + v_canceladas;

    -- Dados detalhados das linhas
    SELECT json_agg(t) INTO v_lines_data
    FROM (
        SELECT 
            l.id,
            l.numero,
            l.status,
            l.created_at,
            c.nome as cliente_nome,
            p.display_name as afiliado_nome
        FROM public.linhas l
        LEFT JOIN public.clientes c ON l.cliente_id = c.id
        LEFT JOIN public.profiles p ON l.user_id = p.id
        ORDER BY l.created_at DESC
        LIMIT 100
    ) t;

    RETURN json_build_object(
        'ativas', v_ativas,
        'suspensas', v_suspensas,
        'canceladas', v_canceladas,
        'reativadas', v_reativadas,
        'total', v_total,
        'linhas', COALESCE(v_lines_data, '[]'::json)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;