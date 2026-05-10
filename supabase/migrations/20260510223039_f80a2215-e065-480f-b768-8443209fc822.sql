-- 1. Criar a tabela de planos
CREATE TABLE IF NOT EXISTS public.planos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    valor NUMERIC(10,2) NOT NULL,
    descricao TEXT,
    features JSONB DEFAULT '[]'::jsonb,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Habilitar RLS
ALTER TABLE public.planos ENABLE ROW LEVEL SECURITY;

-- 3. Políticas RLS para Planos
-- Leitura pública para qualquer usuário autenticado
CREATE POLICY "Planos are viewable by authenticated users" 
ON public.planos FOR SELECT 
USING (auth.role() = 'authenticated');

-- 4. Inserir planos iniciais
INSERT INTO public.planos (nome, valor, descricao, features) VALUES 
('Básico', 79.90, 'Ideal para quem está começando', '["1 Linha", "Suporte Email", "Dashboard Básico"]'),
('Profissional', 99.90, 'O equilíbrio perfeito para crescer', '["Até 3 Linhas", "Suporte WhatsApp", "Automações Inclusas"]'),
('Premium', 149.90, 'Para operações de larga escala', '["Linhas Ilimitadas", "Gerente de Conta", "API de Integração"]');

-- 5. Adicionar plano_id na tabela clientes
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS plano_id UUID REFERENCES public.planos(id);

-- 6. Migrar clientes existentes para o plano Profissional (default)
DO $$
DECLARE
    prof_id UUID;
BEGIN
    SELECT id INTO prof_id FROM public.planos WHERE nome = 'Profissional' LIMIT 1;
    UPDATE public.clientes SET plano_id = prof_id WHERE plano_id IS NULL;
END $$;

-- Comentários
COMMENT ON TABLE public.planos IS 'Tabela que define os planos de assinatura disponíveis no SaaS.';