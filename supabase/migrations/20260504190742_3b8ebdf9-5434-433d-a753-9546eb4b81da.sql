-- Enum para status de mensagens
DO $$ BEGIN
    CREATE TYPE public.sms_status AS ENUM ('pending', 'processing', 'sent', 'delivered', 'failed', 'blacklist');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. Tabela de Créditos
CREATE TABLE IF NOT EXISTS public.sms_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    saldo INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id)
);

-- 2. Tabela de Configurações SMS
CREATE TABLE IF NOT EXISTS public.sms_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    labsmobile_username TEXT,
    labsmobile_token TEXT,
    remetente TEXT,
    limite_por_minuto INTEGER DEFAULT 60,
    webhook_secret TEXT DEFAULT encode(gen_random_bytes(32), 'hex'),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id)
);

-- 3. Listas de Contatos
CREATE TABLE IF NOT EXISTS public.sms_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    descricao TEXT,
    total_contatos INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Contatos
CREATE TABLE IF NOT EXISTS public.sms_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    list_id UUID REFERENCES public.sms_lists(id) ON DELETE CASCADE,
    telefone TEXT NOT NULL,
    nome TEXT,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Blacklist
CREATE TABLE IF NOT EXISTS public.sms_blacklist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    telefone TEXT NOT NULL,
    motivo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, telefone)
);

-- 6. Campanhas
CREATE TABLE IF NOT EXISTS public.sms_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    mensagem TEXT NOT NULL,
    list_id UUID REFERENCES public.sms_lists(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'draft', -- draft, scheduled, processing, completed, canceled
    agendado_para TIMESTAMP WITH TIME ZONE,
    total_envios INTEGER DEFAULT 0,
    entregues INTEGER DEFAULT 0,
    falhas INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 7. Logs de Mensagens (Entrada e Saída)
CREATE TABLE IF NOT EXISTS public.sms_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES public.sms_campaigns(id) ON DELETE SET NULL,
    telefone TEXT NOT NULL,
    mensagem TEXT NOT NULL,
    direcao TEXT DEFAULT 'outbound', -- outbound, inbound
    status public.sms_status DEFAULT 'pending',
    provider_id TEXT, -- ID no LabsMobile
    erro TEXT,
    preco DECIMAL(10,4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 8. RLS (Row Level Security)
ALTER TABLE public.sms_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_blacklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_messages ENABLE ROW LEVEL SECURITY;

-- Políticas de Usuário
CREATE POLICY "SMS: Acesso próprio aos créditos" ON public.sms_credits FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "SMS: Acesso próprio às configurações" ON public.sms_settings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "SMS: Acesso próprio às listas" ON public.sms_lists FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "SMS: Acesso próprio aos contatos" ON public.sms_contacts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "SMS: Acesso próprio à blacklist" ON public.sms_blacklist FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "SMS: Acesso próprio às campanhas" ON public.sms_campaigns FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "SMS: Acesso próprio às mensagens" ON public.sms_messages FOR ALL USING (auth.uid() = user_id);

-- 9. Gatilhos para Updated At
CREATE TRIGGER tr_sms_credits_updated_at BEFORE UPDATE ON public.sms_credits FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER tr_sms_settings_updated_at BEFORE UPDATE ON public.sms_settings FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER tr_sms_lists_updated_at BEFORE UPDATE ON public.sms_lists FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER tr_sms_campaigns_updated_at BEFORE UPDATE ON public.sms_campaigns FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER tr_sms_messages_updated_at BEFORE UPDATE ON public.sms_messages FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 10. Funções Úteis
-- Função para descontar saldo
CREATE OR REPLACE FUNCTION public.sms_deduct_credits(p_user_id UUID, p_amount INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_saldo INTEGER;
BEGIN
    SELECT saldo INTO v_saldo FROM public.sms_credits WHERE user_id = p_user_id FOR UPDATE;
    
    IF v_saldo IS NULL THEN
        INSERT INTO public.sms_credits (user_id, saldo) VALUES (p_user_id, 0);
        v_saldo := 0;
    END IF;

    IF v_saldo >= p_amount THEN
        UPDATE public.sms_credits SET saldo = saldo - p_amount WHERE user_id = p_user_id;
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$;
