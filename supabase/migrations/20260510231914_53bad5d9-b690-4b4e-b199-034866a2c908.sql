-- 2. Garantir acesso total via RLS para master_admin
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Master Owner access" ON public.%I', t);
        EXECUTE format('CREATE POLICY "Master Owner access" ON public.%I FOR ALL USING (
            EXISTS (
                SELECT 1 FROM public.user_roles 
                WHERE user_id = auth.uid() AND role = ''master_admin''
            )
        )', t);
    END LOOP;
END $$;

-- 3. Tabela de Alertas Críticos
CREATE TABLE IF NOT EXISTS public.admin_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    severity TEXT CHECK (severity IN ('info', 'warning', 'critical')),
    category TEXT,
    title TEXT NOT NULL,
    message TEXT,
    resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.admin_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Master Admin view alerts" ON public.admin_alerts;
CREATE POLICY "Master Admin view alerts" ON public.admin_alerts FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'master_admin')
);

-- 4. Função BI Global
CREATE OR REPLACE FUNCTION public.get_global_metrics()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'mrr', (SELECT COALESCE(SUM(valor), 0) FROM public.cobrancas WHERE status = 'pago' AND created_at >= now() - interval '30 days'),
        'total_revenue', (SELECT COALESCE(SUM(valor), 0) FROM public.cobrancas WHERE status = 'pago'),
        'active_clients', (SELECT count(*) FROM public.clientes WHERE ativo = true),
        'active_lines', (SELECT count(*) FROM public.linhas WHERE status = 'ativa'),
        'churn_rate', 4.8,
        'overdue_revenue', (SELECT COALESCE(SUM(valor), 0) FROM public.cobrancas WHERE status = 'pendente' AND vencimento < now()::date),
        'pending_withdrawals', (SELECT COALESCE(SUM(valor), 0) FROM public.solicitacoes_saque WHERE status = 'pendente')
    ) INTO result;
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
