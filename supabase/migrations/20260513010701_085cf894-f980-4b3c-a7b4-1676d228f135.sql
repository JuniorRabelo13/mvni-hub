-- Create assinaturas table
CREATE TABLE public.assinaturas (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    stripe_subscription_id TEXT,
    stripe_customer_id TEXT,
    status TEXT CHECK (status IN ('ativo', 'inadimplente', 'suspenso', 'cancelado')),
    valor NUMERIC,
    data_vencimento DATE,
    data_proxima_cobranca DATE,
    criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.assinaturas ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Users can view their own organization's subscriptions"
ON public.assinaturas
FOR SELECT
TO authenticated
USING (
    is_master_admin(auth.uid()) OR 
    has_role(auth.uid(), 'admin'::app_role) OR
    EXISTS (
        SELECT 1 FROM public.clientes c
        WHERE c.id = public.assinaturas.cliente_id
        AND c.user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert their own organization's subscriptions"
ON public.assinaturas
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

CREATE POLICY "Users can update their own organization's subscriptions"
ON public.assinaturas
FOR UPDATE
TO authenticated
USING (
    is_master_admin(auth.uid()) OR 
    has_role(auth.uid(), 'admin'::app_role) OR
    EXISTS (
        SELECT 1 FROM public.clientes c
        WHERE c.id = public.assinaturas.cliente_id
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