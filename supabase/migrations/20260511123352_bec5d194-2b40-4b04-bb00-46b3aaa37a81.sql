-- Tabela de Projeções Históricas (Snapshots para análise de tendência)
CREATE TABLE IF NOT EXISTS public.master_projections_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    month_year DATE NOT NULL,
    projected_revenue DECIMAL(15,2),
    actual_revenue DECIMAL(15,2),
    projected_churn DECIMAL(5,2),
    projected_expansion_rate DECIMAL(5,2),
    estimated_profit DECIMAL(15,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS
ALTER TABLE public.master_projections_history ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Master profiles can view projections" ON public.master_projections_history
FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'master'));

CREATE POLICY "Master profiles can manage projections" ON public.master_projections_history
FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'master'));
