-- Create extension for HTTP requests if it doesn't exist
CREATE EXTENSION IF NOT EXISTS "http";

-- Function to notify edge function
CREATE OR REPLACE FUNCTION public.fn_whatsapp_on_lead_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- We call the edge function asynchronously (via trigger)
  -- Since we are in a migration, we use the project's edge function URL
  -- Note: The Authorization header should use the service role key or a secret
  -- For this internal trigger, we'll use a simple approach or just log to a table that the edge function polls
  
  -- Actually, a cleaner way in Supabase is using Edge Function Webhooks directly from the UI, 
  -- but since I'm implementing via SQL, I'll use a simple log table that a cron or the agent can watch.
  
  -- Let's update the lead status to 'abordado' if it's within hours (simulated logic)
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- I'll use a different approach: A dedicated table for "Outgoing Queue"
CREATE TABLE IF NOT EXISTS public.whatsapp_queue (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
    payload JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'processed', 'failed'
    scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_queue" ON public.whatsapp_queue FOR ALL TO service_role USING (true);

-- Trigger to enqueue new leads
CREATE OR REPLACE FUNCTION public.enqueue_new_lead_whatsapp()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.whatsapp_queue (lead_id, payload)
    VALUES (NEW.id, jsonb_build_object('action', 'new_lead', 'userId', NEW.user_id));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_whatsapp_enqueue_lead
AFTER INSERT ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.enqueue_new_lead_whatsapp();
