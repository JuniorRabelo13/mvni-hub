-- Tabela de Alertas de Antifraude
CREATE TABLE IF NOT EXISTS public.fraud_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    type TEXT NOT NULL, -- 'multiple_login', 'brute_force', 'financial_anomaly', 'suspicious_ip'
    severity TEXT NOT NULL, -- 'low', 'medium', 'high', 'critical'
    score_impact INT DEFAULT 0,
    details JSONB,
    ip_address TEXT,
    is_resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Adicionar score de risco aos perfis se não existir
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'risk_score') THEN
        ALTER TABLE public.profiles ADD COLUMN risk_score INT DEFAULT 0; -- 0 a 100
    END IF;
END $$;

-- RLS
ALTER TABLE public.fraud_alerts ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Master profiles can view fraud alerts" ON public.fraud_alerts
FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'master'));

CREATE POLICY "Master profiles can update fraud alerts" ON public.fraud_alerts
FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'master'));
