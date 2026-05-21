-- Habilitar a extensão pgvector para RAG e embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- 1. Agentes Especializados
CREATE TABLE IF NOT EXISTS public.ai_agent_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL, -- Ex: 'SDR', 'Suporte', 'Cobrança'
    code TEXT UNIQUE NOT NULL, -- Ex: 'agent_sdr', 'agent_support'
    description TEXT,
    base_prompt TEXT NOT NULL,
    temperature NUMERIC DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 500,
    model TEXT DEFAULT 'gpt-4o',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Templates de Prompts Dinâmicos
CREATE TABLE IF NOT EXISTS public.ai_prompt_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL, -- Ex: 'cobranca_inadimplente', 'boas_vindas'
    template TEXT NOT NULL, -- Jinja-like ou simple replacement {{nome}}, {{valor}}
    category TEXT, -- Vendas, Suporte, Financeiro
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Conversas de IA
CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    whatsapp_instance_id UUID REFERENCES public.whatsapp_instances(id),
    cliente_id UUID REFERENCES public.clientes(id),
    lead_id UUID REFERENCES public.leads(id),
    external_id TEXT, -- ID da conversa na operadora ou whatsapp
    status TEXT DEFAULT 'active', -- active, archived, blocked
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    metadata JSONB DEFAULT '{}'::jsonb, -- Armazena contexto acumulado
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. Mensagens de IA (Histórico)
CREATE TABLE IF NOT EXISTS public.ai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL, -- system, user, assistant
    content TEXT NOT NULL,
    tokens INTEGER,
    agent_id UUID REFERENCES public.ai_agent_settings(id),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Memória Persistente de Longo Prazo
CREATE TABLE IF NOT EXISTS public.ai_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID REFERENCES public.clientes(id),
    lead_id UUID REFERENCES public.leads(id),
    instance_id UUID REFERENCES public.whatsapp_instances(id),
    key TEXT NOT NULL, -- Ex: 'preferencia_contato', 'objecao_principal'
    value TEXT NOT NULL,
    importance_score INTEGER DEFAULT 5, -- 1-10
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(cliente_id, key),
    UNIQUE(lead_id, key)
);

-- 6. Contexto Embeddings (Preparação RAG)
CREATE TABLE IF NOT EXISTS public.ai_context_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL,
    embedding VECTOR(1536), -- Para modelos OpenAI como text-embedding-3-small
    metadata JSONB DEFAULT '{}'::jsonb,
    source_type TEXT, -- pdf, contract, faq, manual
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 7. Controle de Consumo e Custos
CREATE TABLE IF NOT EXISTS public.ai_token_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID, -- Representante ou Admin
    conversation_id UUID REFERENCES public.ai_conversations(id),
    model TEXT NOT NULL,
    prompt_tokens INTEGER DEFAULT 0,
    completion_tokens INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    estimated_cost NUMERIC(10, 6),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 8. Logs de Automação
CREATE TABLE IF NOT EXISTS public.ai_automation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.ai_conversations(id),
    action TEXT NOT NULL, -- auto_reply, follow_up, scoring
    status TEXT NOT NULL, -- success, failure, pending
    execution_time_ms INTEGER,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 9. Lead Scoring Inteligente
CREATE TABLE IF NOT EXISTS public.ai_lead_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES public.leads(id) UNIQUE,
    score_value INTEGER DEFAULT 0, -- 0-100
    classification TEXT, -- hot, warm, cold, risk
    reasons TEXT[], -- Lista de motivos
    last_update TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Triggers de timestamp
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_ai_agent_settings_updated_at') THEN
        CREATE TRIGGER update_ai_agent_settings_updated_at BEFORE UPDATE ON public.ai_agent_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_ai_prompt_templates_updated_at') THEN
        CREATE TRIGGER update_ai_prompt_templates_updated_at BEFORE UPDATE ON public.ai_prompt_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_ai_conversations_updated_at') THEN
        CREATE TRIGGER update_ai_conversations_updated_at BEFORE UPDATE ON public.ai_conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_ai_memory_updated_at') THEN
        CREATE TRIGGER update_ai_memory_updated_at BEFORE UPDATE ON public.ai_memory FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;

-- RLS
ALTER TABLE public.ai_agent_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_prompt_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_context_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_token_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_automation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_lead_scores ENABLE ROW LEVEL SECURITY;

-- Políticas
DROP POLICY IF EXISTS "Allow select for authenticated users" ON public.ai_agent_settings;
CREATE POLICY "Allow select for authenticated users" ON public.ai_agent_settings FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow all for service role" ON public.ai_agent_settings;
CREATE POLICY "Allow all for service role" ON public.ai_agent_settings FOR ALL TO service_role USING (true);

-- Popular agentes padrão (usando ON CONFLICT para evitar erros em re-run)
INSERT INTO public.ai_agent_settings (name, code, description, base_prompt) 
VALUES
('SDR Comercial', 'agent_sdr', 'Especialista em qualificação de leads e agendamento.', 'Você é o SDR do MVNI Hub. Seu objetivo é qualificar o lead e agendar uma demonstração. Seja cordial e focado em converter.'),
('Suporte Técnico', 'agent_support', 'Especialista em resolver problemas de conectividade e planos.', 'Você é o suporte técnico do MVNI Hub. Ajude o cliente a resolver problemas com sua linha telecom de forma rápida.'),
('Cobrança e Recuperação', 'agent_debt', 'Especialista em negociar faturas em atraso.', 'Você é o assistente financeiro do MVNI Hub. Seu objetivo é ajudar o cliente a regularizar sua situação de forma empática.'),
('Onboarding', 'agent_onboarding', 'Especialista em guiar novos clientes nos primeiros passos.', 'Você é o guia de boas-vindas do MVNI Hub. Ajude o novo cliente a configurar sua primeira linha.')
ON CONFLICT (code) DO NOTHING;

-- Popular templates iniciais
INSERT INTO public.ai_prompt_templates (name, slug, template, category) 
VALUES
('Recuperação Inadimplência', 'cobranca_inadimplente', 'Olá {{nome}}, notamos que sua fatura de {{valor}} está pendente. Vamos resolver?', 'Financeiro'),
('Boas Vindas', 'boas_vindas', 'Seja bem-vindo ao MVNI Hub, {{nome}}! Sua linha {{msisdn}} já está em fase de ativação.', 'Onboarding')
ON CONFLICT (slug) DO NOTHING;
