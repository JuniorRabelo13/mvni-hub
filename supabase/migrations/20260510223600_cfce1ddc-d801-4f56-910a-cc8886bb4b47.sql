-- 1. Garantir que a coluna origem existe na tabela auditoria
ALTER TABLE public.auditoria ADD COLUMN IF NOT EXISTS origem TEXT DEFAULT 'humano' CHECK (origem IN ('sistema', 'humano'));

-- 2. Criar função de auditoria para mudanças de status
CREATE OR REPLACE FUNCTION public.fn_auditar_status_cliente()
RETURNS TRIGGER AS $$
DECLARE
    v_origem TEXT;
BEGIN
    -- Capturar a origem da sessão (definida via SET LOCAL app.origem)
    -- Se não definida, assume 'humano' por padrão para ações via API/Dashboard
    BEGIN
        v_origem := current_setting('app.origem');
    EXCEPTION WHEN OTHERS THEN
        v_origem := 'humano';
    END;

    -- Registrar apenas se o status ou a flag ativo mudar
    IF (OLD.ativo IS DISTINCT FROM NEW.ativo) THEN
        INSERT INTO public.auditoria (
            user_id,
            tabela,
            operacao,
            dados_antes,
            dados_depois,
            origem
        ) VALUES (
            auth.uid(), -- ID do operador (null se sistema/cron)
            'clientes',
            'UPDATE_STATUS',
            jsonb_build_object('ativo', OLD.ativo, 'cliente_id', OLD.id, 'nome', OLD.nome),
            jsonb_build_object('ativo', NEW.ativo, 'cliente_id', NEW.id, 'nome', NEW.nome),
            v_origem
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Criar o trigger na tabela clientes
DROP TRIGGER IF EXISTS trg_auditar_status_cliente ON public.clientes;
CREATE TRIGGER trg_auditar_status_cliente
AFTER UPDATE ON public.clientes
FOR EACH ROW
EXECUTE FUNCTION public.fn_auditar_status_cliente();

COMMENT ON FUNCTION public.fn_auditar_status_cliente() IS 'Trigger que registra mudanças de status do cliente para trilha de auditoria.';