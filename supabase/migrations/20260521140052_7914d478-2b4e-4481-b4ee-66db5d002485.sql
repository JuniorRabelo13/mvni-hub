-- Função para incrementar métricas atômicas
CREATE OR REPLACE FUNCTION public.increment_whatsapp_metrics(p_instance_id UUID, p_success BOOLEAN)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.whatsapp_instance_metrics (instance_id, sent_count, failed_count)
    VALUES (p_instance_id, CASE WHEN p_success THEN 1 ELSE 0 END, CASE WHEN p_success THEN 0 ELSE 1 END)
    ON CONFLICT (instance_id) DO UPDATE SET
        sent_count = whatsapp_instance_metrics.sent_count + CASE WHEN p_success THEN 1 ELSE 0 END,
        failed_count = whatsapp_instance_metrics.failed_count + CASE WHEN p_success THEN 0 ELSE 1 END,
        delivery_rate = ((whatsapp_instance_metrics.sent_count + CASE WHEN p_success THEN 1 ELSE 0 END)::NUMERIC / 
                         NULLIF((whatsapp_instance_metrics.sent_count + whatsapp_instance_metrics.failed_count + 1), 0)) * 100;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar métricas vazias ao inserir instância
CREATE OR REPLACE FUNCTION public.initialize_whatsapp_metrics()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.whatsapp_instance_metrics (instance_id) VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_init_wa_metrics
AFTER INSERT ON public.whatsapp_instances
FOR EACH ROW EXECUTE FUNCTION public.initialize_whatsapp_metrics();
