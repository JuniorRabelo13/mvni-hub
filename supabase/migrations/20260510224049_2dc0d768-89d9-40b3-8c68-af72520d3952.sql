-- 1. Tabela de Dados Bancários (Chave Pix)
CREATE TABLE IF NOT EXISTS public.dados_bancarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    tipo_chave TEXT NOT NULL CHECK (tipo_chave IN ('cpf', 'email', 'telefone', 'aleatoria')),
    chave_pix TEXT NOT NULL,
    titular_nome TEXT NOT NULL,
    titular_cpf TEXT NOT NULL,
    verificado BOOLEAN DEFAULT false,
    historico_alteracoes JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabela de Solicitações de Saque
CREATE TABLE IF NOT EXISTS public.solicitacoes_saque (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    wallet_id UUID NOT NULL REFERENCES public.wallets(id),
    dados_bancarios_id UUID NOT NULL REFERENCES public.dados_bancarios(id),
    valor NUMERIC(10,2) NOT NULL CHECK (valor >= 50.00),
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado', 'processando', 'pago')),
    motivo_rejeicao TEXT,
    comprovante_url TEXT,
    solicitado_em TIMESTAMPTZ DEFAULT now(),
    processado_em TIMESTAMPTZ,
    pago_em TIMESTAMPTZ
);

-- 3. Índice para impedir saques pendentes simultâneos do mesmo usuário
CREATE UNIQUE INDEX idx_saque_pendente_unico ON public.solicitacoes_saque (user_id) 
WHERE (status = 'pendente' OR status = 'processando');

-- 4. Trigger de Validação de Saldo
CREATE OR REPLACE FUNCTION public.fn_validar_saldo_saque()
RETURNS TRIGGER AS $$
DECLARE
    v_saldo NUMERIC;
BEGIN
    SELECT saldo_disponivel INTO v_saldo FROM public.wallets WHERE id = NEW.wallet_id;
    
    IF v_saldo < NEW.valor THEN
        RAISE EXCEPTION 'Saldo insuficiente para realizar o saque. Saldo: %, Solicitado: %', v_saldo, NEW.valor;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validar_saldo_saque
BEFORE INSERT ON public.solicitacoes_saque
FOR EACH ROW EXECUTE FUNCTION public.fn_validar_saldo_saque();

-- 5. Função para Aprovação de Saque
CREATE OR REPLACE FUNCTION public.aprovar_saque(p_saque_id UUID)
RETURNS VOID AS $$
DECLARE
    v_valor NUMERIC;
    v_wallet_id UUID;
    v_user_id UUID;
BEGIN
    SELECT valor, wallet_id, user_id INTO v_valor, v_wallet_id, v_user_id 
    FROM public.solicitacoes_saque WHERE id = p_saque_id AND status = 'pendente';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Solicitação de saque não encontrada ou já processada.';
    END IF;

    -- 1. Debitar da Wallet
    UPDATE public.wallets 
    SET saldo_disponivel = saldo_disponivel - v_valor 
    WHERE id = v_wallet_id;

    -- 2. Registrar Transação de Débito
    INSERT INTO public.transacoes_wallet (wallet_id, tipo, valor, descricao, status)
    VALUES (v_wallet_id, 'debito_saque', v_valor * -1, 'Saque via Pix aprovado', 'confirmado');

    -- 3. Atualizar Status do Saque
    UPDATE public.solicitacoes_saque 
    SET status = 'aprovado', processado_em = now() 
    WHERE id = p_saque_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. Habilitar RLS
ALTER TABLE public.dados_bancarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitacoes_saque ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their bank details" 
ON public.dados_bancarios FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their withdrawals" 
ON public.solicitacoes_saque FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can request withdrawals" 
ON public.solicitacoes_saque FOR INSERT WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE public.solicitacoes_saque IS 'Gestão de solicitações de saque multi-tenant com validação de saldo.';