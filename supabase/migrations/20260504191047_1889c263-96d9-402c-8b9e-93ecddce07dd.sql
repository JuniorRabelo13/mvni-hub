-- 1. Função para processar mensagens de entrada (MO) e gerenciar blacklist
CREATE OR REPLACE FUNCTION public.sms_process_inbound()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.direcao = 'inbound' AND (UPPER(NEW.mensagem) LIKE '%SAIR%' OR UPPER(NEW.mensagem) LIKE '%STOP%') THEN
        INSERT INTO public.sms_blacklist (user_id, telefone, motivo)
        VALUES (NEW.user_id, NEW.telefone, 'Solicitado via SMS (SAIR/STOP)')
        ON CONFLICT (user_id, telefone) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER tr_sms_process_inbound
AFTER INSERT ON public.sms_messages
FOR EACH ROW
EXECUTE FUNCTION public.sms_process_inbound();

-- 2. Função para o Worker pegar mensagens pendentes
CREATE OR REPLACE FUNCTION public.sms_claim_messages(p_limit INTEGER DEFAULT 50)
RETURNS SETOF public.sms_messages
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    UPDATE public.sms_messages
    SET status = 'processing',
        updated_at = now()
    WHERE id IN (
        SELECT id
        FROM public.sms_messages
        WHERE status = 'pending'
        AND direcao = 'outbound'
        ORDER BY created_at ASC
        FOR UPDATE SKIP LOCKED
        LIMIT p_limit
    )
    RETURNING *;
END;
$$;

-- 3. Função para disparar uma campanha (criar as mensagens na fila)
CREATE OR REPLACE FUNCTION public.sms_trigger_campaign(p_campaign_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_campaign public.sms_campaigns;
    v_contacts_count INTEGER;
BEGIN
    SELECT * INTO v_campaign FROM public.sms_campaigns WHERE id = p_campaign_id;
    
    IF v_campaign.status != 'draft' AND v_campaign.status != 'scheduled' THEN
        RETURN;
    END IF;

    -- Contar contatos
    SELECT count(*) INTO v_contacts_count FROM public.sms_contacts WHERE list_id = v_campaign.list_id;

    -- Validar saldo (Simplificado: 1 crédito por contato)
    IF NOT public.sms_deduct_credits(v_campaign.user_id, v_contacts_count) THEN
        RAISE EXCEPTION 'Saldo insuficiente para disparar esta campanha.';
    END IF;

    -- Atualizar status da campanha
    UPDATE public.sms_campaigns 
    SET status = 'processing',
        total_envios = v_contacts_count,
        updated_at = now()
    WHERE id = p_campaign_id;

    -- Gerar mensagens (ignora blacklist)
    INSERT INTO public.sms_messages (user_id, campaign_id, telefone, mensagem, status)
    SELECT 
        c.user_id, 
        p_campaign_id, 
        c.telefone, 
        REPLACE(v_campaign.mensagem, '{nome}', COALESCE(c.nome, 'Cliente')), 
        CASE 
            WHEN b.id IS NOT NULL THEN 'blacklist'::public.sms_status
            ELSE 'pending'::public.sms_status
        END
    FROM public.sms_contacts c
    LEFT JOIN public.sms_blacklist b ON c.telefone = b.telefone AND c.user_id = b.user_id
    WHERE c.list_id = v_campaign.list_id;
END;
$$;
