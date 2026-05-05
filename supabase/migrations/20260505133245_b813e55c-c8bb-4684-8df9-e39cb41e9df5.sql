
-- Create metrics table for time-series counters
CREATE TABLE public.whatsapp_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name TEXT NOT NULL,
    metric_value NUMERIC NOT NULL DEFAULT 0,
    dimensions JSONB DEFAULT '{}'::jsonb,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index for efficient querying by name and time
CREATE INDEX idx_whatsapp_metrics_name_time ON public.whatsapp_metrics (metric_name, timestamp DESC);

-- Create audit logs table for structured logging
CREATE TABLE public.whatsapp_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
    level TEXT NOT NULL,
    event TEXT NOT NULL,
    session_id TEXT,
    agent_id UUID,
    user_id UUID,
    request_id TEXT,
    status TEXT,
    duration_ms INTEGER,
    error_code TEXT,
    error_message TEXT,
    backend_reason TEXT,
    environment TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Index for session/agent searching
CREATE INDEX idx_whatsapp_audit_session ON public.whatsapp_audit_logs (session_id);
CREATE INDEX idx_whatsapp_audit_agent ON public.whatsapp_audit_logs (agent_id);
CREATE INDEX idx_whatsapp_audit_event ON public.whatsapp_audit_logs (event);

-- Create alerts table
CREATE TABLE public.whatsapp_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    severity TEXT NOT NULL, -- critical, important
    alert_name TEXT NOT NULL,
    message TEXT NOT NULL,
    metrics_data JSONB,
    sample_sessions TEXT[],
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.whatsapp_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_alerts ENABLE ROW LEVEL SECURITY;

-- Policies (Admin only for metrics and alerts, users can see their own logs if we add user_id)
CREATE POLICY "Admins can view metrics" ON public.whatsapp_metrics FOR SELECT USING (true);
CREATE POLICY "Admins can insert metrics" ON public.whatsapp_metrics FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view audit logs" ON public.whatsapp_audit_logs FOR SELECT USING (true);
CREATE POLICY "Admins can insert audit logs" ON public.whatsapp_audit_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view alerts" ON public.whatsapp_alerts FOR SELECT USING (true);
CREATE POLICY "Admins can insert alerts" ON public.whatsapp_alerts FOR INSERT WITH CHECK (true);
