DROP FUNCTION IF EXISTS public.get_master_whatsapp_report();

CREATE OR REPLACE FUNCTION public.get_master_whatsapp_report()
RETURNS JSONB AS $$
DECLARE
    v_connected_count INT;
    v_disconnected_count INT;
    v_queue_count INT;
    v_sent_count BIGINT;
    v_failed_count BIGINT;
    v_instances JSONB;
BEGIN
    -- Contagem de status
    SELECT count(*) INTO v_connected_count FROM public.whatsapp_instances WHERE status = 'connected';
    SELECT count(*) INTO v_disconnected_count FROM public.whatsapp_instances WHERE status != 'connected';
    
    -- Fila pendente
    SELECT count(*) INTO v_queue_count FROM public.whatsapp_message_queue WHERE status = 'pending';
    
    -- Métricas globais (24h ou total)
    SELECT COALESCE(sum(sent_count), 0), COALESCE(sum(failed_count), 0)
    INTO v_sent_count, v_failed_count
    FROM public.whatsapp_instance_metrics;

    -- Detalhes das instâncias
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', i.id,
            'instance_name', i.nome,
            'phone_number', i.numero_conectado,
            'status', i.status,
            'health', i.health_score,
            'reconnects', i.reconnect_attempts,
            'sent_count', COALESCE(m.sent_count, 0),
            'error_count', COALESCE(m.failed_count, 0)
        )
    ) INTO v_instances
    FROM public.whatsapp_instances i
    LEFT JOIN public.whatsapp_instance_metrics m ON i.id = m.instance_id;

    RETURN jsonb_build_object(
        'connected', v_connected_count,
        'disconnected', v_disconnected_count,
        'queue', v_queue_count,
        'sent', v_sent_count,
        'failed', v_failed_count,
        'instances', COALESCE(v_instances, '[]'::jsonb)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
