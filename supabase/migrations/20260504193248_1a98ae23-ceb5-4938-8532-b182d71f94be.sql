-- Leads Table
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    telefone TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'novo',
    ultimo_contato TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- WhatsApp Agents
CREATE TABLE IF NOT EXISTS public.whatsapp_agents (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    numero_whatsapp TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'ativo',
    limite_diario INTEGER NOT NULL DEFAULT 20,
    nivel_aquecimento INTEGER NOT NULL DEFAULT 1,
    mensagens_enviadas_hoje INTEGER NOT NULL DEFAULT 0,
    ultima_mensagem_em TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- WhatsApp Messages
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    agente_id UUID REFERENCES public.whatsapp_agents(id) ON DELETE SET NULL,
    mensagem TEXT NOT NULL,
    direcao TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'enviada',
    ia_resposta BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
