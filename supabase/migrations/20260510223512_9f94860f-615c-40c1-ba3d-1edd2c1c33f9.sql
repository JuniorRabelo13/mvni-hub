-- 1. Criar tabela de perfis de usuários para gerenciar roles se não existir
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    role TEXT DEFAULT 'afiliado', -- 'admin' ou 'afiliado'
    last_login TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Habilitar RLS nos perfis
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" 
ON public.user_profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" 
ON public.user_profiles FOR SELECT 
USING (COALESCE(auth.jwt() ->> 'role', 'afiliado') = 'admin');

-- 3. Criar View Consolidada para Admins
-- Esta view agrega os dados de clientes e planos para cada afiliado (dono dos dados)
CREATE OR REPLACE VIEW public.admin_mrr_consolidado AS
SELECT 
    up.id as afiliado_id,
    up.email as afiliado_email,
    count(c.id) FILTER (WHERE c.ativo = true) as clientes_ativos,
    count(c.id) FILTER (WHERE c.ativo = false) as clientes_inativos,
    COALESCE(sum(p.valor) FILTER (WHERE c.ativo = true), 0) as mrr_atual,
    up.last_login as ultimo_acesso
FROM 
    public.user_profiles up
LEFT JOIN 
    public.clientes c ON up.id = c.user_id
LEFT JOIN 
    public.planos p ON c.plano_id = p.id
GROUP BY 
    up.id, up.email, up.last_login;

-- 4. Função para histórico de MRR
CREATE OR REPLACE FUNCTION public.get_mrr_historico(p_meses int)
RETURNS TABLE (mes DATE, mrr_total NUMERIC) AS $$
BEGIN
    RETURN QUERY
    WITH meses_serie AS (
        SELECT generate_series(
            date_trunc('month', now()) - (p_meses || ' months')::interval,
            date_trunc('month', now()),
            '1 month'::interval
        )::date as data_mes
    )
    SELECT 
        ms.data_mes,
        COALESCE(sum(f.valor), 0) as mrr_total
    FROM 
        meses_serie ms
    LEFT JOIN 
        public.faturas f ON date_trunc('month', f.mes_referencia) = ms.data_mes
    GROUP BY 
        ms.data_mes
    ORDER BY 
        ms.data_mes ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Comentários
COMMENT ON VIEW public.admin_mrr_consolidado IS 'Visão restrita a administradores para monitoramento de KPIs da rede.';