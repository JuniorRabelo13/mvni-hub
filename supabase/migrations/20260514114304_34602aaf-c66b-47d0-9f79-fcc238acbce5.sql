-- Create a table to track processed events (idempotency)
CREATE TABLE IF NOT EXISTS public.processed_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id TEXT UNIQUE NOT NULL, -- Stripe Event ID, Transaction ID, etc.
    source TEXT NOT NULL,         -- 'stripe', 'pix_api', 'manual_payout'
    status TEXT NOT NULL DEFAULT 'processed',
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.processed_events ENABLE ROW LEVEL SECURITY;

-- Only service role or admins should deal with this normally, 
-- but we'll add a view policy for debugging if needed.
CREATE POLICY "Admins can view processed events" 
ON public.processed_events 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND (role = 'admin' OR role = 'master')
  )
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_processed_events_event_id ON public.processed_events(event_id);
CREATE INDEX IF NOT EXISTS idx_processed_events_created_at ON public.processed_events(created_at);

-- Add versioning or status check lock to solicitacoes_saque if not exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='solicitacoes_saque' AND column_name='processamento_iniciado_em') THEN
        ALTER TABLE public.solicitacoes_saque ADD COLUMN processamento_iniciado_em TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;
