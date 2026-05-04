-- Criar tipo enum para status de conexão se não existir
DO $$ BEGIN
    CREATE TYPE public.whatsapp_connection_status AS ENUM ('qr', 'conectado', 'desconectado');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Atualizar whatsapp_agents
ALTER TABLE public.whatsapp_agents 
ADD COLUMN IF NOT EXISTS session_id UUID DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS conectado BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ultima_atividade TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS status_conexao public.whatsapp_connection_status DEFAULT 'desconectado',
ADD COLUMN IF NOT EXISTS qr_code TEXT;

-- Tabela para persistência de chaves de autenticação (Baileys)
CREATE TABLE IF NOT EXISTS public.whatsapp_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID REFERENCES public.whatsapp_agents(id) ON DELETE CASCADE,
    data JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.whatsapp_sessions ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Users can manage their own sessions" ON public.whatsapp_sessions 
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.whatsapp_agents WHERE id = agent_id AND user_id = auth.uid())
    );

-- Trigger para atualizar ultima_atividade ao enviar mensagens
CREATE OR REPLACE FUNCTION public.update_whatsapp_agent_activity()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.whatsapp_agents 
    SET ultima_atividade = now()
    WHERE id = NEW.agent_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_update_whatsapp_activity
AFTER INSERT ON public.whatsapp_messages
FOR EACH ROW EXECUTE FUNCTION public.update_whatsapp_agent_activity();
