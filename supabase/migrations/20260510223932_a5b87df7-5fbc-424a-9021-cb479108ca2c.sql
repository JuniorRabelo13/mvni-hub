CREATE OR REPLACE FUNCTION public.liberar_transacao_wallet(
    p_transacao_id UUID,
    p_wallet_id UUID,
    p_valor NUMERIC
)
RETURNS VOID AS $$
BEGIN
    -- 1. Diminuir do saldo bloqueado e aumentar no disponível
    UPDATE public.wallets 
    SET 
        saldo_bloqueado = saldo_bloqueado - p_valor,
        saldo_disponivel = saldo_disponivel + p_valor
    WHERE id = p_wallet_id;

    -- 2. Marcar transação como confirmada
    UPDATE public.transacoes_wallet 
    SET status = 'confirmado'
    WHERE id = p_transacao_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;