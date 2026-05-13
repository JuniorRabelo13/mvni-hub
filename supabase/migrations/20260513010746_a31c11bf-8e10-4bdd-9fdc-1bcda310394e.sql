-- Create pagamentos table
CREATE TABLE public.pagamentos (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    assinatura_id UUID NOT NULL REFERENCES public.assinaturas(id) ON DELETE CASCADE,
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    stripe_payment_id TEXT,
    valor NUMERIC,
    status TEXT,
    data_vencimento DATE,
    data_pagamento DATE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.pagamentos ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Users can view their own organization's payments"
ON public.pagamentos
FOR SELECT
TO authenticated
USING (
    is_master_admin(auth.uid()) OR 
    has_role(auth.uid(), 'admin'::app_role) OR
    EXISTS (
        SELECT 1 FROM public.clientes c
        WHERE c.id = public.pagamentos.cliente_id
        AND c.user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert their own organization's payments"
ON public.pagamentos
FOR INSERT
TO authenticated
WITH CHECK (
    is_master_admin(auth.uid()) OR 
    has_role(auth.uid(), 'admin'::app_role) OR
    EXISTS (
        SELECT 1 FROM public.clientes c
        WHERE c.id = cliente_id
        AND c.user_id = auth.uid()
    )
);

CREATE POLICY "Users can update their own organization's payments"
ON public.pagamentos
FOR UPDATE
TO authenticated
USING (
    is_master_admin(auth.uid()) OR 
    has_role(auth.uid(), 'admin'::app_role) OR
    EXISTS (
        SELECT 1 FROM public.clientes c
        WHERE c.id = public.pagamentos.cliente_id
        AND c.user_id = auth.uid()
    )
)
WITH CHECK (
    is_master_admin(auth.uid()) OR 
    has_role(auth.uid(), 'admin'::app_role) OR
    EXISTS (
        SELECT 1 FROM public.clientes c
        WHERE c.id = cliente_id
        AND c.user_id = auth.uid()
    )
);