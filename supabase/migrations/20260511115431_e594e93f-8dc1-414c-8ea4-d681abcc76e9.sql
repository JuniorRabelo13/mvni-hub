CREATE OR REPLACE FUNCTION public.get_master_whatsapp_report()
RETURNS json AS $$
DECLARE
    v_total_connected bigint;
    v_total_disconnected bigint;
    v_total_sent bigint;
    v_total_failed bigint;
    v_pending_queue bigint;
    v_sessions json;
BEGIN
    -- Contagem de sessões por status (assumindo tabela whatsapp_sessions ou similar no ecossistema)
    -- Caso a tabela não exista, retornamos zeros para evitar erro de execução imediata
    BEGIN
        SELECT COUNT(*) INTO v_total_connected FROM public.whatsapp_sessions WHERE status = 'connected';
        SELECT COUNT(*) INTO v_total_disconnected FROM public.whatsapp_sessions WHERE status != 'connected';
    EXCEPTION WHEN OTHERS THEN
        v_total_connected := 0;
        v_total_disconnected := 0;
    END;

    -- Contagem de mensagens (assumindo tabela whatsapp_messages)
    BEGIN
        SELECT COUNT(*) INTO v_total_sent FROM public.whatsapp_messages WHERE status = 'sent';
        SELECT COUNT(*) INTO v_total_failed FROM public.whatsapp_messages WHERE status = 'failed';
        SELECT COUNT(*) INTO v_pending_queue FROM public.whatsapp_messages WHERE status = 'pending';
    EXCEPTION WHEN OTHERS THEN
        v_total_sent := 0;
        v_total_failed := 0;
        v_pending_queue := 0;
    END;

    -- Lista de instâncias
    BEGIN
        SELECT json_agg(t) INTO v_sessions
        FROM (
            SELECT 
                s.id,
                s.instance_name,
                s.status,
                s.phone_number,
                s.last_connected_at,
                (SELECT COUNT(*) FROM public.whatsapp_messages m WHERE m.session_id = s.id AND m.status = 'sent') as sent_count,
                (SELECT COUNT(*) FROM public.whatsapp_messages m WHERE m.session_id = s.id AND m.status = 'failed') as error_count,
                s.metadata->>'reconnects' as reconnects,
                s.metadata->>'battery' as health
            FROM public.whatsapp_sessions s
            LIMIT 50
        ) t;
    EXCEPTION WHEN OTHERS THEN
        v_sessions := '[]'::json;
    END;

    RETURN json_build_object(
        'connected', v_total_connected,
        'disconnected', v_total_disconnected,
        'sent', v_total_sent,
        'failed', v_total_failed,
        'queue', v_pending_queue,
        'instances', COALESCE(v_sessions, '[]'::json)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;