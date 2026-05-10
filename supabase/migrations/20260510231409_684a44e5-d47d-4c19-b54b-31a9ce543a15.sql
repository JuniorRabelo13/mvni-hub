-- Função para chamar a Edge Function
CREATE OR REPLACE FUNCTION public.fn_trigger_notify_status_change()
RETURNS TRIGGER AS $$
DECLARE
    request_payload JSON;
BEGIN
    -- Só dispara se o status mudou
    IF (OLD.status IS DISTINCT FROM NEW.status) THEN
        request_payload := json_build_object(
            'type', 'status_change',
            'cliente_id', NEW.cliente_id,
            'msisdn', NEW.msisdn,
            'status', NEW.status
        );
        
        -- Chama a Edge Function via HTTP (precisa da extensão pg_net ou via worker externo)
        -- Aqui vamos usar o padrão de inserir em uma fila ou log, mas para o exemplo direto:
        PERFORM net.http_post(
            url := (SELECT value FROM secrets WHERE name = 'SUPABASE_URL') || '/functions/v1/notificar-status',
            headers := jsonb_build_object(
                'Content-Type', 'application/json',
                'Authorization', 'Bearer ' || (SELECT value FROM secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY')
            ),
            body := request_payload::jsonb
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger na tabela linhas
DROP TRIGGER IF EXISTS tr_notify_line_status_change ON public.linhas;
CREATE TRIGGER tr_notify_line_status_change
AFTER UPDATE ON public.linhas
FOR EACH ROW
EXECUTE FUNCTION public.fn_trigger_notify_status_change();
