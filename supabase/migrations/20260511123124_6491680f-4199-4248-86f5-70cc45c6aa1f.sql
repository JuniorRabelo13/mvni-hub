-- Tabela de Comissões
CREATE TABLE IF NOT EXISTS public.commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    type TEXT NOT NULL, -- 'direct', 'indirect', 'bonus', 'recurring'
    status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'cancelled'
    description TEXT,
    reference_id UUID, -- ID da transação ou cliente que gerou a comissão
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    paid_at TIMESTAMP WITH TIME ZONE
);

-- RLS
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Master profiles can view all commissions" ON public.commissions
FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'master'));

CREATE POLICY "Users can view their own commissions" ON public.commissions
FOR SELECT USING (profile_id = auth.uid());

-- Função para Ranking Financeiro
CREATE OR REPLACE FUNCTION public.get_commission_ranking(limit_count INT DEFAULT 10)
RETURNS TABLE (
    profile_id UUID,
    nome TEXT,
    total_commissions DECIMAL(12,2),
    paid_commissions DECIMAL(12,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.nome,
        SUM(c.amount) as total_commissions,
        SUM(CASE WHEN c.status = 'paid' THEN c.amount ELSE 0 END) as paid_commissions
    FROM public.profiles p
    JOIN public.commissions c ON p.id = c.profile_id
    GROUP BY p.id, p.nome
    ORDER BY total_commissions DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
