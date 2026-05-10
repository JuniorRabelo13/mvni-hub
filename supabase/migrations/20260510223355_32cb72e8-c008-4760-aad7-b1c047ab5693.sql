CREATE TABLE IF NOT EXISTS public.notificacoes_enviadas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL, -- ex: 'vencimento_3_dias'
    referencia_mes DATE NOT NULL, -- Primeiro dia do mês de referência
    status TEXT NOT NULL, -- 'sucesso' ou 'erro'
    detalhes TEXT,
    enviado_em TIMESTAMPTZ DEFAULT now(),
    
    CONSTRAINT unique_notificacao_cliente_tipo_mes UNIQUE(cliente_id, tipo, referencia_mes)
);

ALTER TABLE public.notificacoes_enviadas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" 
ON public.notificacoes_enviadas FOR SELECT 
USING (auth.uid() IN (SELECT user_id FROM public.clientes WHERE id = cliente_id));

COMMENT ON TABLE public.notificacoes_enviadas IS 'Controle de mensagens enviadas via WhatsApp para evitar duplicidade.';