-- Tabela de templates de mensagens
CREATE TABLE IF NOT EXISTS public.whatsapp_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL, -- 'welcome', 'suspended', 'reactivated'
    body TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso (admin apenas, mas para simplificar vamos deixar leitura pública)
CREATE POLICY "Templates visíveis por todos" ON public.whatsapp_templates FOR SELECT USING (true);

-- Templates Padrão
INSERT INTO public.whatsapp_templates (slug, body) VALUES 
('welcome', 'Olá {{nome}}! Seja bem-vindo ao {{saas_name}}. Sua linha {{msisdn}} está ativa e pronta para uso!'),
('suspended', 'Olá {{nome}}. Informamos que sua linha {{msisdn}} foi suspensa por falta de pagamento. Regularize agora para voltar a navegar.'),
('reactivated', 'Olá {{nome}}! Boas notícias: sua linha {{msisdn}} foi reativada e já está operando normalmente.');

-- Adicionar flag de notificação em clientes ou configurações globais
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS notify_whatsapp BOOLEAN DEFAULT true;

-- Tabela de Logs de Notificação (Opcional, mas útil)
CREATE TABLE IF NOT EXISTS public.whatsapp_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID REFERENCES public.clientes(id),
    status TEXT, -- 'sent', 'failed'
    message_body TEXT,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.whatsapp_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Logs visíveis pelo dono do cliente" ON public.whatsapp_logs FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM public.clientes WHERE id = cliente_id)
);
