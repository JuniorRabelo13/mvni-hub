-- Create the notifications history table
CREATE TABLE public.notificacoes_vencimento (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    numero_whatsapp TEXT NOT NULL,
    data_envio TIMESTAMP WITH TIME ZONE DEFAULT now(),
    status TEXT NOT NULL,
    fatura_id UUID REFERENCES public.pagamentos(id) ON DELETE SET NULL,
    mensagem_enviada TEXT,
    erro TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notificacoes_vencimento ENABLE ROW LEVEL SECURITY;

-- Create policies for access
CREATE POLICY "Admins can view all notifications history" 
ON public.notificacoes_vencimento 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'master_admin')
    )
);

-- Allow system/functions to insert (service role usually, but explicitly allowing for safety if called via client)
CREATE POLICY "System can insert notifications history" 
ON public.notificacoes_vencimento 
FOR INSERT 
WITH CHECK (true);
