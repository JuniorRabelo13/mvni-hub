-- Tabela de Snapshots de Saúde do Sistema
CREATE TABLE IF NOT EXISTS public.master_system_health (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status TEXT NOT NULL, -- 'healthy', 'warning', 'critical'
    uptime_percentage DECIMAL(5,2),
    active_workers INT,
    online_whatsapp_instances INT,
    error_rate_24h DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS
ALTER TABLE public.master_system_health ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Master profiles can view system health" ON public.master_system_health
FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'master'));

-- Inserir snapshot inicial (mock)
INSERT INTO public.master_system_health (status, uptime_percentage, active_workers, online_whatsapp_instances, error_rate_24h)
VALUES ('healthy', 99.98, 42, 1250, 0.05);
