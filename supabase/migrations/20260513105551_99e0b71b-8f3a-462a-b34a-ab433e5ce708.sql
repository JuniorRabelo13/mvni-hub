-- Create notifications table
CREATE TABLE public.notificacoes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL CHECK (tipo IN ('pre_vencimento', 'vencimento_hoje', 'pos_vencimento')),
    canal TEXT NOT NULL DEFAULT 'whatsapp',
    mensagem TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('enviado', 'falhou')),
    enviado_em TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

-- Create policies based on project pattern (using user_id)
CREATE POLICY "Users can view their own notifications" 
ON public.notificacoes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notifications" 
ON public.notificacoes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);
