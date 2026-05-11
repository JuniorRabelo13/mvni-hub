CREATE OR REPLACE FUNCTION public.get_global_finance_metrics()
RETURNS json AS $$
DECLARE
    v_total_revenue numeric;
    v_revenue_current_month numeric;
    v_mrr numeric;
    v_overdue_revenue numeric;
    v_active_subscriptions bigint;
    v_average_ticket numeric;
    v_estimated_profit numeric;
    v_growth_rate numeric;
    v_revenue_last_month numeric;
BEGIN
    -- Receita Total
    SELECT COALESCE(SUM(valor), 0) INTO v_total_revenue FROM public.comissoes;

    -- Receita do Mês Atual
    SELECT COALESCE(SUM(valor), 0) INTO v_revenue_current_month 
    FROM public.comissoes 
    WHERE created_at >= date_trunc('month', now());

    -- MRR (Considerando R$ 20 recorrentes por linha ativa no sistema)
    SELECT COALESCE(COUNT(id) * 20.0, 0) INTO v_mrr 
    FROM public.linhas 
    WHERE status = 'ativa';

    -- Inadimplência Total (Estimado via status de faturas/linhas se disponível, ou fallback zero por enquanto)
    -- Ajuste conforme a tabela de faturas real se existir.
    v_overdue_revenue := 0; 

    -- Ticket Médio (Baseado em clientes e receita total)
    SELECT COALESCE(v_total_revenue / NULLIF(COUNT(DISTINCT user_id), 0), 0) INTO v_average_ticket 
    FROM public.comissoes;

    -- Lucro Estimado (Considerando margem fictícia de 40% sobre a receita do mês, ajuste conforme necessário)
    v_estimated_profit := v_revenue_current_month * 0.4;

    -- Crescimento Mensal (Comparativo mês atual vs anterior)
    SELECT COALESCE(SUM(valor), 0) INTO v_revenue_last_month 
    FROM public.comissoes 
    WHERE created_at >= date_trunc('month', now() - interval '1 month') 
      AND created_at < date_trunc('month', now());
    
    IF v_revenue_last_month > 0 THEN
        v_growth_rate := ((v_revenue_current_month - v_revenue_last_month) / v_revenue_last_month) * 100;
    ELSE
        v_growth_rate := 100; -- Primeiro mês ou crescimento de zero
    END IF;

    RETURN json_build_object(
        'total_revenue', v_total_revenue,
        'revenue_month', v_revenue_current_month,
        'mrr', v_mrr,
        'overdue_revenue', v_overdue_revenue,
        'average_ticket', v_average_ticket,
        'estimated_profit', v_estimated_profit,
        'growth_rate', ROUND(v_growth_rate, 2)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;