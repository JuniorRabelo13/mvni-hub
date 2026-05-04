-- Ajustar tabela de sessões
ALTER TABLE IF EXISTS public.whatsapp_sessions ADD COLUMN IF NOT EXISTS key_id TEXT;
ALTER TABLE IF EXISTS public.whatsapp_sessions RENAME COLUMN data TO value;

-- Adicionar UNIQUE constraint se não existir
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'whatsapp_sessions_agent_id_key_id_key') THEN
        ALTER TABLE public.whatsapp_sessions ADD CONSTRAINT whatsapp_sessions_agent_id_key_id_key UNIQUE(agent_id, key_id);
    END IF;
END $$;

-- Garantir colunas na tabela de agentes
ALTER TABLE public.whatsapp_agents ADD COLUMN IF NOT EXISTS qr_code TEXT;
ALTER TABLE public.whatsapp_agents ADD COLUMN IF NOT EXISTS status_conexao TEXT DEFAULT 'desconectado';
ALTER TABLE public.whatsapp_agents ADD COLUMN IF NOT EXISTS session_id UUID DEFAULT gen_random_uuid();

-- Ajustar políticas (Remover e recriar para garantir que está correta)
DROP POLICY IF EXISTS "Users can manage their own sessions" ON public.whatsapp_sessions;
CREATE POLICY "Users can manage their own sessions" ON public.whatsapp_sessions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.whatsapp_agents 
            WHERE whatsapp_agents.id = whatsapp_sessions.agent_id 
            AND whatsapp_agents.user_id = auth.uid()
        )
    );
