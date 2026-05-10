-- 1. Tabela de Indicações (se não existir)
CREATE TABLE IF NOT EXISTS public.indicacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    indicador_user_id UUID NOT NULL REFERENCES auth.users(id),
    indicado_user_id UUID NOT NULL REFERENCES auth.users(id) UNIQUE, -- Um usuário só pode ser indicado uma vez
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT self_referral_check CHECK (indicador_user_id <> indicado_user_id)
);

-- 2. Função Recursiva para Detecção de Ciclos
CREATE OR REPLACE FUNCTION public.detectar_ciclo_indicacao(p_indicador_id UUID, p_indicado_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_has_cycle BOOLEAN;
BEGIN
    WITH RECURSIVE referral_path AS (
        -- Base: começa do indicador que está tentando indicar alguém
        SELECT indicador_user_id, indicado_user_id, ARRAY[p_indicado_id, p_indicador_id] as path
        FROM public.indicacoes
        WHERE indicado_user_id = p_indicador_id
        
        UNION ALL
        
        -- Recursão: sobe na árvore de indicadores
        SELECT i.indicador_user_id, i.indicado_user_id, rp.path || i.indicador_user_id
        FROM public.indicacoes i
        JOIN referral_path rp ON i.indicado_user_id = rp.indicador_user_id
        WHERE NOT (i.indicador_user_id = ANY(rp.path)) -- Evita loop infinito no scan
    )
    SELECT EXISTS (
        SELECT 1 FROM referral_path WHERE indicador_user_id = p_indicado_id
    ) INTO v_has_cycle;

    RETURN v_has_cycle;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Trigger Anti-Ciclo
CREATE OR REPLACE FUNCTION public.fn_prevent_circular_referral()
RETURNS TRIGGER AS $$
BEGIN
    IF public.detectar_ciclo_indicacao(NEW.indicador_user_id, NEW.indicado_user_id) THEN
        RAISE EXCEPTION 'Fraude detectada: Ciclo de indicação identificado. Esta operação criaria uma rede circular.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_circular_referral
BEFORE INSERT ON public.indicacoes
FOR EACH ROW EXECUTE FUNCTION public.fn_prevent_circular_referral();

-- 4. Tabela de Fingerprints e Alertas
CREATE TABLE IF NOT EXISTS public.fingerprints_login (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    ip_address INET,
    user_agent TEXT,
    fingerprint_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.admin_alertas_fraude (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo TEXT NOT NULL, -- 'IP_COMPARTILHADO', 'CICLO_REDE', 'MULTI_CONTAS'
    user_ids UUID[] NOT NULL,
    score_risco INT CHECK (score_risco BETWEEN 1 AND 10),
    detalhes JSONB,
    resolvido BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. View de Auditoria de Fraude
CREATE OR REPLACE VIEW public.view_admin_alertas_fraude AS
SELECT 
    id,
    tipo,
    user_ids,
    score_risco,
    detalhes,
    resolvido,
    created_at
FROM public.admin_alertas_fraude
WHERE NOT resolvido
ORDER BY score_risco DESC, created_at DESC;

-- 6. Habilitar RLS
ALTER TABLE public.indicacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fingerprints_login ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_alertas_fraude ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view fraud alerts" 
ON public.admin_alertas_fraude FOR SELECT 
USING (COALESCE(auth.jwt() ->> 'role', 'afiliado') = 'admin');

COMMENT ON FUNCTION public.detectar_ciclo_indicacao IS 'Analisa recursivamente a árvore de indicações para prevenir estruturas fraudulentas circulares.';