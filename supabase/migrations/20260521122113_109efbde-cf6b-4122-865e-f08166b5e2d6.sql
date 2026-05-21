CREATE OR REPLACE FUNCTION public.get_global_finance_metrics()
 RETURNS json
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_total_revenue numeric;
    v_revenue_current_month numeric;
    v_mrr numeric;
    v_overdue_revenue numeric;
    v_active_lines_count bigint;
    v_average_ticket numeric;
    v_estimated_profit numeric;
    v_growth_rate numeric;
    v_revenue_last_month numeric;
    v_total_commissions_current_month numeric;
    v_operational_cost_per_line numeric := 49.90;
    v_official_plan_price numeric := 99.90;
BEGIN
    -- Receita Total Histórica (Baseada em pagamentos confirmados)
    SELECT COALESCE(SUM(valor), 0) INTO v_total_revenue FROM public.pagamentos WHERE status = 'pago';

    -- Receita do Mês Atual (Pagamentos confirmados no mês)
    SELECT COALESCE(SUM(valor), 0) INTO v_revenue_current_month 
    FROM public.pagamentos 
    WHERE status = 'pago' AND created_at >= date_trunc('month', now());

    -- Contagem de Linhas Ativas
    SELECT COUNT(id) INTO v_active_lines_count 
    FROM public.linhas 
    WHERE status = 'ativa';

    -- MRR Global (Baseado no valor oficial de R$ 99,90 por linha ativa)
    v_mrr := v_active_lines_count * v_official_plan_price;

    -- Inadimplência (Soma de faturas pendentes vencidas)
    SELECT COALESCE(SUM(valor), 0) INTO v_overdue_revenue 
    FROM public.pagamentos 
    WHERE status = 'pendente' AND data_vencimento < now();

    -- Ticket Médio (Baseado no plano único oficial)
    v_average_ticket := v_official_plan_price;

    -- Comissões totais geradas no mês atual (ativacações + recorrência)
    SELECT COALESCE(SUM(valor_total), 0) INTO v_total_commissions_current_month
    FROM public.comissoes_mensais
    WHERE mes_referencia = to_char(now(), 'YYYY-MM');

    -- Lucro Estimado Real (Faturamento Mensal - Custos Operacionais - Comissões)
    -- Faturamento Mensal aqui é considerado como o MRR (projeção de recebimento)
    v_estimated_profit := v_mrr - (v_active_lines_count * v_operational_cost_per_line) - v_total_commissions_current_month;

    -- Crescimento Mensal (Comparativo receita mês atual vs anterior)
    SELECT COALESCE(SUM(valor), 0) INTO v_revenue_last_month 
    FROM public.pagamentos 
    WHERE status = 'pago' 
      AND created_at >= date_trunc('month', now() - interval '1 month') 
      AND created_at < date_trunc('month', now());
    
    IF v_revenue_last_month > 0 THEN
        v_growth_rate := ((v_revenue_current_month - v_revenue_last_month) / v_revenue_last_month) * 100;
    ELSE
        v_growth_rate := 100;
    END IF;

    RETURN json_build_object(
        'total_revenue', v_total_revenue,
        'revenue_month', v_revenue_current_month,
        'mrr', v_mrr,
        'overdue_revenue', v_overdue_revenue,
        'average_ticket', v_average_ticket,
        'estimated_profit', v_estimated_profit,
        'active_lines', v_active_lines_count,
        'growth_rate', ROUND(v_growth_rate, 2)
    );
END;
$function$;
