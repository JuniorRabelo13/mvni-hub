-- Enums para estados e status
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'whatsapp_instance_status') THEN
        CREATE TYPE whatsapp_instance_status AS ENUM ('connecting', 'qr_pending', 'connected', 'reconnecting', 'disconnected', 'banned', 'timeout', 'rate_limited');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'whatsapp_queue_status') THEN
        CREATE TYPE whatsapp_queue_status AS ENUM ('pending', 'processing', 'sent', 'failed', 'cancelled', 'scheduled');
    END IF;
END $$;

-- 1. whatsapp_instances
CREATE TABLE IF NOT EXISTS public.whatsapp_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    numero_conectado TEXT,
    provider TEXT DEFAULT 'evolution_api',
    session_id TEXT UNIQUE NOT NULL,
    status whatsapp_instance_status DEFAULT 'disconnected',
    health_score INTEGER DEFAULT 100,
    reconnect_attempts INTEGER DEFAULT 0,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT now(),
    qr_code TEXT,
    connected_at TIMESTAMP WITH TIME ZONE,
    disconnected_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. whatsapp_instance_health
CREATE TABLE IF NOT EXISTS public.whatsapp_instance_health (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id UUID REFERENCES public.whatsapp_instances(id) ON DELETE CASCADE,
    status whatsapp_instance_status NOT NULL,
    latency_ms INTEGER,
    heartbeat_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    details JSONB
);

-- 3. whatsapp_message_queue
CREATE TABLE IF NOT EXISTS public.whatsapp_message_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id UUID REFERENCES public.whatsapp_instances(id) ON DELETE SET NULL,
    telefone TEXT NOT NULL,
    mensagem TEXT NOT NULL,
    prioridade INTEGER DEFAULT 0,
    status whatsapp_queue_status DEFAULT 'pending',
    retries INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 5,
    scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    processed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. whatsapp_message_logs
CREATE TABLE IF NOT EXISTS public.whatsapp_message_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_id UUID REFERENCES public.whatsapp_message_queue(id) ON DELETE SET NULL,
    instance_id UUID REFERENCES public.whatsapp_instances(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    status TEXT NOT NULL,
    execution_time_ms INTEGER,
    provider_response JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. whatsapp_instance_metrics
CREATE TABLE IF NOT EXISTS public.whatsapp_instance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id UUID REFERENCES public.whatsapp_instances(id) ON DELETE CASCADE UNIQUE,
    sent_count BIGINT DEFAULT 0,
    failed_count BIGINT DEFAULT 0,
    avg_response_time_ms INTEGER DEFAULT 0,
    delivery_rate NUMERIC(5,2) DEFAULT 0,
    last_reset_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. whatsapp_reconnect_logs
CREATE TABLE IF NOT EXISTS public.whatsapp_reconnect_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id UUID REFERENCES public.whatsapp_instances(id) ON DELETE CASCADE,
    attempt_number INTEGER NOT NULL,
    reason TEXT,
    success BOOLEAN DEFAULT false,
    backoff_seconds INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS
ALTER TABLE public.whatsapp_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_instance_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_message_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_message_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_instance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_reconnect_logs ENABLE ROW LEVEL SECURITY;

-- Políticas Básicas (Admin access)
CREATE POLICY "Admin can do everything on whatsapp_instances" ON public.whatsapp_instances FOR ALL USING (true);
CREATE POLICY "Admin can do everything on whatsapp_instance_health" ON public.whatsapp_instance_health FOR ALL USING (true);
CREATE POLICY "Admin can do everything on whatsapp_message_queue" ON public.whatsapp_message_queue FOR ALL USING (true);
CREATE POLICY "Admin can do everything on whatsapp_message_logs" ON public.whatsapp_message_logs FOR ALL USING (true);
CREATE POLICY "Admin can do everything on whatsapp_instance_metrics" ON public.whatsapp_instance_metrics FOR ALL USING (true);
CREATE POLICY "Admin can do everything on whatsapp_reconnect_logs" ON public.whatsapp_reconnect_logs FOR ALL USING (true);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_whatsapp_instances_updated_at BEFORE UPDATE ON public.whatsapp_instances FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Índices
CREATE INDEX idx_wa_instances_status ON public.whatsapp_instances(status);
CREATE INDEX idx_wa_queue_status_priority ON public.whatsapp_message_queue(status, prioridade DESC, scheduled_at ASC);
CREATE INDEX idx_wa_queue_instance ON public.whatsapp_message_queue(instance_id);
CREATE INDEX idx_wa_logs_created ON public.whatsapp_message_logs(created_at DESC);
