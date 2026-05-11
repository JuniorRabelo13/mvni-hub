-- Tabela de Planos SaaS
CREATE TABLE IF NOT EXISTS public.saas_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    monthly_price NUMERIC NOT NULL DEFAULT 0,
    commission_rate NUMERIC NOT NULL DEFAULT 0, -- % de comissão
    whatsapp_limit INTEGER NOT NULL DEFAULT 0,
    lines_limit INTEGER NOT NULL DEFAULT 0,
    automation_limit INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.saas_plans ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso (Apenas Master Admin - simplificado para o exemplo)
CREATE POLICY "Enable read access for all users" ON public.saas_plans FOR SELECT USING (true);
CREATE POLICY "Enable all access for master admins" ON public.saas_plans FOR ALL USING (true);

-- Inserir planos iniciais
INSERT INTO public.saas_plans (name, description, monthly_price, commission_rate, whatsapp_limit, lines_limit, automation_limit)
VALUES 
('Starter', 'Ideal para pequenos negócios', 97.00, 10, 1, 5, 100),
('Pro', 'Para empresas em crescimento', 197.00, 15, 3, 20, 1000),
('Enterprise', 'Escala total e suporte dedicado', 497.00, 20, 10, 100, 10000)
ON CONFLICT DO NOTHING;
