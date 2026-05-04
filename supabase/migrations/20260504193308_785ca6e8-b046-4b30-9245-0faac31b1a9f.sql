-- WhatsApp Campaigns
CREATE TABLE IF NOT EXISTS public.whatsapp_campaigns (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ativo',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- WhatsApp Config
CREATE TABLE IF NOT EXISTS public.whatsapp_config (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    horario_inicio TIME NOT NULL DEFAULT '08:30:00',
    horario_fim TIME NOT NULL DEFAULT '20:00:00',
    prompt_ia TEXT,
    delay_min INTEGER NOT NULL DEFAULT 20,
    delay_max INTEGER NOT NULL DEFAULT 90,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_config ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "leads_owner_all" ON public.leads FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "agents_owner_all" ON public.whatsapp_agents FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "messages_lead_owner" ON public.whatsapp_messages FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.leads WHERE id = whatsapp_messages.lead_id AND user_id = auth.uid()));
CREATE POLICY "messages_insert_lead_owner" ON public.whatsapp_messages FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.leads WHERE id = whatsapp_messages.lead_id AND user_id = auth.uid()));
CREATE POLICY "campaigns_owner_all" ON public.whatsapp_campaigns FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "config_owner_all" ON public.whatsapp_config FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Triggers for updated_at
CREATE TRIGGER trg_leads_updated BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION tg_set_updated_at();
CREATE TRIGGER trg_whatsapp_agents_updated BEFORE UPDATE ON whatsapp_agents FOR EACH ROW EXECUTE FUNCTION tg_set_updated_at();
CREATE TRIGGER trg_whatsapp_campaigns_updated BEFORE UPDATE ON whatsapp_campaigns FOR EACH ROW EXECUTE FUNCTION tg_set_updated_at();
CREATE TRIGGER trg_whatsapp_config_updated BEFORE UPDATE ON whatsapp_config FOR EACH ROW EXECUTE FUNCTION tg_set_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_leads_user_status ON public.leads(user_id, status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_lead ON public.whatsapp_messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_agents_user ON public.whatsapp_agents(user_id);
