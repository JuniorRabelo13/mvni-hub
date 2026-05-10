-- Criar tabela de logs se não existir
CREATE TABLE IF NOT EXISTS public.logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) DEFAULT auth.uid(),
    acao TEXT NOT NULL,
    detalhes JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Criar tabela de auditoria se não existir
CREATE TABLE IF NOT EXISTS public.auditoria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) DEFAULT auth.uid(),
    tabela TEXT NOT NULL,
    operacao TEXT NOT NULL,
    dados_antes JSONB DEFAULT '{}'::jsonb,
    dados_depois JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar Row Level Security (RLS) e forçar aplicação
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs FORCE ROW LEVEL SECURITY;

ALTER TABLE public.auditoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditoria FORCE ROW LEVEL SECURITY;

/* 
 * POLICIES PARA A TABELA: logs
 */

-- SELECT: Usuário vê apenas seus próprios logs
CREATE POLICY "Users can view their own logs" 
ON public.logs FOR SELECT 
USING (auth.uid() = user_id);

-- INSERT: Usuário só insere logs para si mesmo
CREATE POLICY "Users can insert their own logs" 
ON public.logs FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Usuário só altera seus próprios logs
CREATE POLICY "Users can update their own logs" 
ON public.logs FOR UPDATE 
USING (auth.uid() = user_id);

-- DELETE: Usuário só deleta seus próprios logs
CREATE POLICY "Users can delete their own logs" 
ON public.logs FOR DELETE 
USING (auth.uid() = user_id);

/* 
 * POLICIES PARA A TABELA: auditoria
 */

-- SELECT: Usuário vê apenas sua própria auditoria
CREATE POLICY "Users can view their own audit records" 
ON public.auditoria FOR SELECT 
USING (auth.uid() = user_id);

-- INSERT: Usuário só insere auditoria para si mesmo
CREATE POLICY "Users can insert their own audit records" 
ON public.auditoria FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- UPDATE: Usuário só altera sua própria auditoria
CREATE POLICY "Users can update their own audit records" 
ON public.auditoria FOR UPDATE 
USING (auth.uid() = user_id);

-- DELETE: Usuário só deleta sua própria auditoria
CREATE POLICY "Users can delete their own audit records" 
ON public.auditoria FOR DELETE 
USING (auth.uid() = user_id);

-- Comentários de documentação
COMMENT ON TABLE public.logs IS 'Registros de eventos do sistema com isolamento multi-tenant.';
COMMENT ON TABLE public.auditoria IS 'Trilha de auditoria de alterações em tabelas com isolamento multi-tenant.';