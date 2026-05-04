-- Drop existing table if it exists
DROP TABLE IF EXISTS public.security_logs;

-- Create table with new structure
CREATE TABLE public.security_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    campo_detectado TEXT NOT NULL,
    origem TEXT NOT NULL,
    hash_payload TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read
CREATE POLICY "Admins can read security logs" 
ON public.security_logs 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- No direct inserts/updates/deletes
-- (implicitly blocked by enabling RLS and not adding policies for them)

-- Create secure insert function with rate limiting
CREATE OR REPLACE FUNCTION public.log_security_event(
    p_user UUID,
    p_campo TEXT,
    p_origem TEXT,
    p_hash TEXT
) RETURNS VOID AS $$
DECLARE
    v_log_count INTEGER;
BEGIN
    -- Check rate limit (max 20 logs/min per user)
    SELECT count(*) INTO v_log_count
    FROM public.security_logs
    WHERE user_id = p_user
    AND created_at > now() - interval '1 minute';

    IF v_log_count >= 20 THEN
        RETURN; -- Silently ignore to avoid side-channel information about limits
    END IF;

    -- Insert log
    INSERT INTO public.security_logs (user_id, campo_detectado, origem, hash_payload)
    VALUES (p_user, p_campo, p_origem, p_hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
