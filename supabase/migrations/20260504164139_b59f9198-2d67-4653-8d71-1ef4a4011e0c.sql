-- Função para retornar configurações de forma segura
CREATE OR REPLACE FUNCTION public.get_configuracoes_safe()
RETURNS TABLE (
    id UUID,
    chave TEXT,
    valor TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id, 
        c.chave,
        CASE 
            WHEN (c.chave ILIKE '%key%' OR c.chave ILIKE '%token%' OR c.chave ILIKE '%secret%') 
                 AND NOT (SELECT EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'))
            THEN 
                CASE 
                    WHEN length(c.valor) > 8 THEN left(c.valor, 4) || '****' || right(c.valor, 4)
                    ELSE '****'
                END
            ELSE c.valor
        END as valor,
        c.created_at,
        c.updated_at
    FROM public.configuracoes c;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Revogar acesso direto e permitir apenas via função
REVOKE SELECT ON public.configuracoes FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_configuracoes_safe() TO authenticated;

-- Criar tabela de logs de segurança
CREATE TABLE public.security_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    campo_detectado TEXT,
    origem TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Ativar RLS nos logs
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ver logs de segurança
CREATE POLICY "Admins can view security logs" 
ON public.security_logs 
FOR SELECT 
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin'));

-- Usuários autenticados podem inserir logs (para o frontend registrar detecções)
CREATE POLICY "Users can insert security logs" 
ON public.security_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);
