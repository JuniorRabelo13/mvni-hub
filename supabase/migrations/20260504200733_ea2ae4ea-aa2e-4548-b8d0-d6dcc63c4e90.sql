-- Tabela global para controle anti-spam
CREATE TABLE IF NOT EXISTS public.whatsapp_global_sends (
    phone TEXT PRIMARY KEY,
    last_sent_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS para a tabela global
ALTER TABLE public.whatsapp_global_sends ENABLE ROW LEVEL SECURITY;

-- Política: Todos podem ver (para checagem), mas apenas o sistema/autenticados podem inserir/atualizar
CREATE POLICY "Public read for global sends" ON public.whatsapp_global_sends FOR SELECT USING (true);
CREATE POLICY "Authenticated insert/update global sends" ON public.whatsapp_global_sends FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated update global sends" ON public.whatsapp_global_sends FOR UPDATE USING (auth.role() = 'authenticated');

-- Estatísticas e progresso de aquecimento
CREATE TABLE IF NOT EXISTS public.whatsapp_number_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES public.whatsapp_agents(id) ON DELETE CASCADE,
    warming_level INTEGER DEFAULT 1,
    daily_volume_limit INTEGER DEFAULT 40,
    total_sent INTEGER DEFAULT 0,
    total_replies INTEGER DEFAULT 0,
    total_errors INTEGER DEFAULT 0,
    safety_status TEXT DEFAULT 'safe' CHECK (safety_status IN ('safe', 'warning', 'paused')),
    last_recalculation_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.whatsapp_number_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own number stats" ON public.whatsapp_number_stats FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.whatsapp_agents WHERE id = agent_id AND user_id = auth.uid())
);

-- Modificar whatsapp_agents para remover limite manual e adicionar metadados de cobrança
ALTER TABLE public.whatsapp_agents 
DROP COLUMN IF EXISTS daily_limit,
ADD COLUMN IF NOT EXISTS subscription_price DECIMAL(10,2) DEFAULT 49.90,
ADD COLUMN IF NOT EXISTS next_billing_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '1 month');

-- Função para verificar disponibilidade global e registrar
CREATE OR REPLACE FUNCTION public.check_and_register_whatsapp_send(target_phone TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    can_send BOOLEAN;
BEGIN
    -- Verifica se o telefone recebeu mensagem nos últimos 10 dias
    SELECT NOT EXISTS (
        SELECT 1 FROM public.whatsapp_global_sends 
        WHERE phone = target_phone 
        AND last_sent_at > (now() - interval '10 days')
    ) INTO can_send;

    IF can_send THEN
        INSERT INTO public.whatsapp_global_sends (phone, last_sent_at)
        VALUES (target_phone, now())
        ON CONFLICT (phone) DO UPDATE SET last_sent_at = now();
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para calcular volume variável (aquecimento inteligente)
CREATE OR REPLACE FUNCTION public.calculate_next_day_volume(current_level INTEGER, error_rate FLOAT, reply_rate FLOAT)
RETURNS INTEGER AS $$
DECLARE
    base_vol INTEGER;
    random_factor INTEGER;
    new_vol INTEGER;
BEGIN
    -- Base cresce com o nível (dia)
    base_vol := LEAST(300, 40 + (current_level * 15));
    
    -- Gerar fator aleatório entre -15% e +15% para quebrar padrões
    random_factor := (floor(random() * 31) - 15)::INTEGER;
    
    new_vol := base_vol + (base_vol * random_factor / 100);
    
    -- Penalidade por erro alto (> 5%)
    IF error_rate > 0.05 THEN
        new_vol := new_vol * 0.7;
    END IF;
    
    -- Bônus por resposta alta (> 10%)
    IF reply_rate > 0.1 THEN
        new_vol := new_vol * 1.2;
    END IF;

    RETURN LEAST(300, GREATEST(20, new_vol));
END;
$$ LANGUAGE plpgsql;
