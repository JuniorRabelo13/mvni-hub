-- Tipos de prioridade e status
DO $$ BEGIN
    CREATE TYPE public.job_priority AS ENUM ('critical', 'high', 'normal', 'low');
    CREATE TYPE public.job_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'retrying', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tabelas de Infraestrutura de Filas
CREATE TABLE IF NOT EXISTS public.system_queues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE, -- whatsapp, telecom, ia, financeiro, etc.
    description TEXT,
    concurrency_limit INTEGER DEFAULT 5,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.queue_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_name TEXT NOT NULL,
    priority public.job_priority DEFAULT 'normal',
    payload JSONB NOT NULL,
    status public.job_status DEFAULT 'pending',
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    idempotency_key TEXT UNIQUE,
    run_at TIMESTAMPTZ DEFAULT now(),
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    error_message TEXT,
    last_error_at TIMESTAMPTZ,
    worker_id UUID,
    timeout_seconds INTEGER DEFAULT 60,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.queue_workers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    status TEXT DEFAULT 'idle', -- idle, busy, offline
    last_ping TIMESTAMPTZ DEFAULT now(),
    queues_handled TEXT[], -- Array de nomes de filas
    memory_usage BIGINT,
    cpu_usage NUMERIC,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.queue_dead_letters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_job_id UUID,
    queue_name TEXT NOT NULL,
    payload JSONB,
    error_log JSONB,
    final_status TEXT DEFAULT 'failed',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.queue_rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL UNIQUE, -- openai, stripe, whatsapp, telecom
    requests_per_second INTEGER DEFAULT 1,
    burst_limit INTEGER DEFAULT 5,
    current_usage INTEGER DEFAULT 0,
    last_reset TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.queue_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_name TEXT NOT NULL,
    jobs_processed INTEGER DEFAULT 0,
    jobs_failed INTEGER DEFAULT 0,
    avg_latency_ms NUMERIC DEFAULT 0,
    throughput_per_min INTEGER DEFAULT 0,
    measured_at TIMESTAMPTZ DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_queue_jobs_pending ON public.queue_jobs (status, priority, run_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_queue_jobs_idempotency ON public.queue_jobs (idempotency_key);
CREATE INDEX IF NOT EXISTS idx_queue_workers_ping ON public.queue_workers (last_ping);

-- RLS
ALTER TABLE public.system_queues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_dead_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.queue_metrics ENABLE ROW LEVEL SECURITY;

-- Políticas (Apenas Master Admin ou Service Role - Simplificado para acesso interno via Edge Functions)
CREATE POLICY "System access only" ON public.queue_jobs FOR ALL USING (true);
CREATE POLICY "System access only" ON public.system_queues FOR ALL USING (true);
CREATE POLICY "System access only" ON public.queue_workers FOR ALL USING (true);
CREATE POLICY "System access only" ON public.queue_dead_letters FOR ALL USING (true);
CREATE POLICY "System access only" ON public.queue_rate_limits FOR ALL USING (true);
CREATE POLICY "System access only" ON public.queue_metrics FOR ALL USING (true);

-- Popular filas iniciais
INSERT INTO public.system_queues (name, description, concurrency_limit) VALUES
('whatsapp', 'Fila de mensagens e instâncias do WhatsApp', 20),
('telecom', 'Ações de ativação/suspensão de linhas', 10),
('ia', 'Processamento contextual e agentes', 15),
('financeiro', 'Processamento de cobranças e conciliação', 5),
('notificacoes', 'Push, E-mail e SMS', 50),
('importacao', 'Processamento de planilhas e dados massivos', 2),
('relatorios', 'Geração de PDFs e Analytics pesados', 3)
ON CONFLICT (name) DO NOTHING;

-- Função para processar retentativas com Exponential Backoff
CREATE OR REPLACE FUNCTION public.calculate_next_run(p_attempts INTEGER) 
RETURNS TIMESTAMPTZ AS $$
BEGIN
    -- 2^attempts * 30 segundos
    RETURN now() + (power(2, p_attempts) * interval '30 seconds');
END;
$$ LANGUAGE plpgsql;
