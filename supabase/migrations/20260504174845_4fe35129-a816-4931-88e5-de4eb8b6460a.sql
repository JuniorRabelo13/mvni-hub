-- 1. Hardening de security_logs
-- Garantir estrutura correta
ALTER TABLE IF EXISTS public.security_logs 
ADD COLUMN IF NOT EXISTS hash_payload TEXT;

-- Remover colunas que possam conter PII se existirem (ex: se houvesse um payload bruto)
-- (No nosso caso, já estávamos usando hash_payload, mas vamos reforçar a política)

-- 2. RLS e Segurança
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

-- Limpar políticas existentes para evitar conflitos
DROP POLICY IF EXISTS "Admins can view security logs" ON public.security_logs;
DROP POLICY IF EXISTS "Only admins can read security logs" ON public.security_logs;

CREATE POLICY "Only admins can read security logs" 
ON public.security_logs 
FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Inserção via function apenas, desabilitar insert direto via API
DROP POLICY IF EXISTS "Anyone can insert logs" ON public.security_logs;

-- 3. Função segura de insert com Rate Limit
CREATE OR REPLACE FUNCTION public.log_security_event(
    p_user uuid,
    p_campo text,
    p_origem text,
    p_hash text
) RETURNS void 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql 
AS $$
DECLARE
    v_log_count integer;
BEGIN
    -- Rate limit: máx 20 logs/min por user_id
    SELECT count(*) INTO v_log_count
    FROM security_logs
    WHERE user_id = p_user
    AND created_at > now() - interval '1 minute';

    IF v_log_count >= 20 THEN
        RETURN; -- Silently ignore above limit to avoid being used for side-channel info
    END IF;

    INSERT INTO security_logs(user_id, campo_detectado, origem, hash_payload)
    VALUES (p_user, p_campo, p_origem, p_hash);
END;
$$;

-- Revogar execução pública e conceder apenas a usuários autenticados
REVOKE EXECUTE ON FUNCTION public.log_security_event(uuid, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_security_event(uuid, text, text, text) TO authenticated;

-- Índice para performance do rate limit
CREATE INDEX IF NOT EXISTS idx_security_logs_user_at ON public.security_logs(user_id, created_at);
