-- 1. Criar tabela de wallets
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    saldo_disponivel NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (saldo_disponivel >= 0),
    saldo_bloqueado NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (saldo_bloqueado >= 0),
    saldo_a_liberar NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (saldo_a_liberar >= 0),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Criar tabela de transações da wallet
CREATE TABLE IF NOT EXISTS public.transacoes_wallet (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL CHECK (tipo IN ('credito_ativacao', 'credito_recorrencia', 'credito_bonus', 'debito_saque', 'estorno')),
    valor NUMERIC(10,2) NOT NULL,
    descricao TEXT,
    referencia_id UUID, -- ID da fatura, cliente ou processo de origem
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('confirmado', 'pendente', 'estornado')),
    data_liberacao TIMESTAMPTZ, -- Quando o saldo bloqueado se torna disponível
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Habilitar RLS
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacoes_wallet ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own wallet" 
ON public.wallets FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own transactions" 
ON public.transacoes_wallet FOR SELECT 
USING (wallet_id IN (SELECT id FROM public.wallets WHERE user_id = auth.uid()));

-- 4. Trigger para manter updated_at da wallet
CREATE OR REPLACE FUNCTION public.update_wallet_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.wallets SET updated_at = now() WHERE id = NEW.wallet_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_wallet_timestamp
AFTER INSERT OR UPDATE ON public.transacoes_wallet
FOR EACH ROW EXECUTE FUNCTION public.update_wallet_timestamp();

-- 5. Função de Crédito na Wallet
CREATE OR REPLACE FUNCTION public.creditar_wallet(
    p_user_id UUID,
    p_tipo TEXT,
    p_valor NUMERIC,
    p_referencia_id UUID,
    p_dias_carencia INT DEFAULT 0
)
RETURNS VOID AS $$
DECLARE
    v_wallet_id UUID;
    v_data_liberacao TIMESTAMPTZ := NULL;
BEGIN
    -- Garantir que a wallet existe
    INSERT INTO public.wallets (user_id)
    VALUES (p_user_id)
    ON CONFLICT (user_id) DO NOTHING;
    
    SELECT id INTO v_wallet_id FROM public.wallets WHERE user_id = p_user_id;

    IF p_dias_carencia > 0 THEN
        v_data_liberacao := now() + (p_dias_carencia || ' days')::interval;
        
        -- Atualizar saldo bloqueado
        UPDATE public.wallets 
        SET saldo_bloqueado = saldo_bloqueado + p_valor
        WHERE id = v_wallet_id;
        
        -- Registrar transação pendente
        INSERT INTO public.transacoes_wallet (wallet_id, tipo, valor, referencia_id, status, data_liberacao)
        VALUES (v_wallet_id, p_tipo, p_valor, p_referencia_id, 'pendente', v_data_liberacao);
    ELSE
        -- Crédito imediato
        UPDATE public.wallets 
        SET saldo_disponivel = saldo_disponivel + p_valor
        WHERE id = v_wallet_id;
        
        -- Registrar transação confirmada
        INSERT INTO public.transacoes_wallet (wallet_id, tipo, valor, referencia_id, status)
        VALUES (v_wallet_id, p_tipo, p_valor, p_referencia_id, 'confirmado');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON TABLE public.wallets IS 'Controle financeiro multi-tenant de saldos disponíveis e bloqueados.';