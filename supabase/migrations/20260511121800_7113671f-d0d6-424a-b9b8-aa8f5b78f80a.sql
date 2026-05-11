-- Função para buscar relatório global de gateways
CREATE OR REPLACE FUNCTION public.get_master_gateways_report()
RETURNS TABLE (
    gateway_id TEXT,
    gateway_name TEXT,
    status TEXT,
    volume_total NUMERIC,
    volume_pix NUMERIC,
    volume_card NUMERIC,
    success_rate NUMERIC,
    failed_count INTEGER,
    webhook_health NUMERIC,
    active_subscriptions INTEGER,
    last_processed TIMESTAMP WITH TIME ZONE
) LANGUAGE plpgsql STABLE AS $$
BEGIN
    RETURN QUERY
    -- Simulando dados de gateways (Stripe, PagBank, etc)
    SELECT 
        'gw_stripe_01'::text as gateway_id,
        'Stripe'::text as gateway_name,
        'online'::text as status,
        452500.50::numeric as volume_total,
        125000.25::numeric as volume_pix,
        327500.25::numeric as volume_card,
        98.5::numeric as success_rate,
        142::integer as failed_count,
        100.0::numeric as webhook_health,
        1250::integer as active_subscriptions,
        now() - interval '2 minutes' as last_processed
    UNION ALL
    SELECT 
        'gw_pagbank_01'::text as gateway_id,
        'PagBank'::text as gateway_name,
        'online'::text as status,
        289400.75::numeric as volume_total,
        250400.75::numeric as volume_pix,
        39000.00::numeric as volume_card,
        97.2::numeric as success_rate,
        285::integer as failed_count,
        99.8::numeric as webhook_health,
        840::integer as active_subscriptions,
        now() - interval '5 minutes' as last_processed
    UNION ALL
    SELECT 
        'gw_mercadopago_01'::text as gateway_id,
        'Mercado Pago'::text as gateway_name,
        'unstable'::text as status,
        156000.00::numeric as volume_total,
        140000.00::numeric as volume_pix,
        16000.00::numeric as volume_card,
        89.4::numeric as success_rate,
        412::integer as failed_count,
        85.5::numeric as webhook_health,
        310::integer as active_subscriptions,
        now() - interval '15 minutes' as last_processed;
END;
$$;
