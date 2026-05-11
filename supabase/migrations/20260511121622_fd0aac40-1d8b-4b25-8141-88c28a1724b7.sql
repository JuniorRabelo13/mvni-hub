-- Função para buscar alertas críticos em tempo real
CREATE OR REPLACE FUNCTION public.get_master_critical_alerts()
RETURNS TABLE (
    id UUID,
    severity TEXT,
    title TEXT,
    description TEXT,
    category TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    is_resolved BOOLEAN,
    metadata JSONB
) LANGUAGE plpgsql STABLE AS $$
BEGIN
    RETURN QUERY
    -- Simulando alertas para a interface (em um cenário real, isso leria de uma tabela de incidentes/logs)
    -- Alerta: Queda de Receita (Baseado em comparação de performance)
    SELECT 
        gen_random_uuid() as id,
        'critica'::text as severity,
        'Queda Abrupta de Receita'::text as title,
        'Detectada queda de 25% na receita nas últimas 24h comparado à média semanal.'::text as description,
        'financeiro'::text as category,
        now() - interval '15 minutes' as created_at,
        false as is_resolved,
        '{"impact": "alto", "trend": "-25%"}'::jsonb as metadata
    UNION ALL
    -- Alerta: Edge Functions falhando
    SELECT 
        gen_random_uuid() as id,
        'critica'::text as severity,
        'Falhas em Edge Functions'::text as title,
        'Múltiplas falhas detectadas na função "process-webhook". Taxa de erro: 12%.'::text as description,
        'infraestrutura'::text as category,
        now() - interval '5 minutes' as created_at,
        false as is_resolved,
        '{"function": "process-webhook", "error_rate": "12%"}'::jsonb as metadata
    UNION ALL
    -- Alerta: WhatsApp desconectado
    SELECT 
        gen_random_uuid() as id,
        'media'::text as severity,
        'WhatsApp Desconectado'::text as title,
        'Sessão "Atendimento_02" perdeu conexão com o servidor.'::text as description,
        'whatsapp'::text as category,
        now() - interval '42 minutes' as created_at,
        false as is_resolved,
        '{"session_id": "att_02", "last_ping": "42m ago"}'::jsonb as metadata
    UNION ALL
    -- Alerta: Aumento de Inadimplência
    SELECT 
        gen_random_uuid() as id,
        'media'::text as severity,
        'Aumento de Inadimplência'::text as title,
        'Pico de faturas vencidas detectado na região Sul.'::text as description,
        'financeiro'::text as category,
        now() - interval '2 hours' as created_at,
        false as is_resolved,
        '{"region": "Sul", "increase": "8%"}'::jsonb as metadata
    UNION ALL
    -- Alerta: Falha de Automação
    SELECT 
        gen_random_uuid() as id,
        'baixa'::text as severity,
        'Falha em Automação de Retenção'::text as title,
        'A regra "Upsell 30 dias" falhou ao processar 5 leads.'::text as description,
        'automacao'::text as category,
        now() - interval '4 hours' as created_at,
        false as is_resolved,
        '{"rule_id": "ret_30", "failed_items": 5}'::jsonb as metadata
    ORDER BY created_at DESC;
END;
$$;
