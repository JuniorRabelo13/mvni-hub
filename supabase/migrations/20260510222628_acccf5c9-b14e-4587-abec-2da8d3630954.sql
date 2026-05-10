-- 1. Criar a tabela de faturas caso não exista
CREATE TABLE IF NOT EXISTS public.faturas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) DEFAULT auth.uid(),
    valor NUMERIC(10,2) NOT NULL CHECK (valor >= 0),
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'cancelado', 'vencido')),
    mes_referencia DATE NOT NULL, -- Recomendado: sempre o primeiro dia do mês (ex: 2023-10-01)
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    pago_em TIMESTAMPTZ,
    
    -- 2. Constraint de Unicidade: Impede faturamento duplicado para o mesmo cliente no mesmo mês
    CONSTRAINT unique_fatura_cliente_mes UNIQUE(cliente_id, mes_referencia)
);

-- 3. Índice de performance para consultas por período (comum em dashboards e cron jobs)
CREATE INDEX IF NOT EXISTS idx_faturas_mes_referencia ON public.faturas(mes_referencia);
CREATE INDEX IF NOT EXISTS idx_faturas_user_id ON public.faturas(user_id);

-- 4. Habilitar e Forçar RLS para isolamento multi-tenant
ALTER TABLE public.faturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faturas FORCE ROW LEVEL SECURITY;

-- Políticas de RLS
CREATE POLICY "Users can view their own invoices" 
ON public.faturas FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own invoices" 
ON public.faturas FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invoices" 
ON public.faturas FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own invoices" 
ON public.faturas FOR DELETE USING (auth.uid() = user_id);

-- 5. Função PostgreSQL para registro idempotente
-- Retorna TRUE se a fatura foi inserida, FALSE se já existia (conflito ignorado)
CREATE OR REPLACE FUNCTION public.registrar_fatura_idempotente(
    p_cliente_id UUID, 
    p_user_id UUID, 
    p_valor NUMERIC, 
    p_mes DATE
)
RETURNS BOOLEAN AS $$
DECLARE
    v_inserted_id UUID;
BEGIN
    INSERT INTO public.faturas (cliente_id, user_id, valor, mes_referencia)
    VALUES (p_cliente_id, p_user_id, p_valor, p_mes)
    ON CONFLICT (cliente_id, mes_referencia) DO NOTHING
    RETURNING id INTO v_inserted_id;

    RETURN v_inserted_id IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentários técnicos
COMMENT ON COLUMN public.faturas.mes_referencia IS 'Data de referência da fatura, sugerido usar sempre o dia 01 do mês para consistência.';
COMMENT ON FUNCTION public.registrar_fatura_idempotente IS 'Garante que repetições da Edge Function não gerem faturas duplicadas via ON CONFLICT.';