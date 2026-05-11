CREATE OR REPLACE FUNCTION public.get_master_audit_logs(
    p_user_id UUID DEFAULT NULL,
    p_event_type TEXT DEFAULT NULL,
    p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
    log_id UUID,
    event_time TIMESTAMP WITH TIME ZONE,
    event_type TEXT,
    event_message TEXT,
    actor_id UUID,
    actor_name TEXT,
    target_id UUID,
    metadata JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.id,
        l.created_at,
        l.event_type,
        l.message,
        l.user_id,
        COALESCE(p.display_name, p.email, 'Sistema'),
        l.target_id,
        l.metadata
    FROM 
        public.admin_logs l
    LEFT JOIN 
        public.profiles p ON l.user_id = p.id
    WHERE 
        (p_user_id IS NULL OR l.user_id = p_user_id)
        AND (p_event_type IS NULL OR l.event_type = p_event_type)
        AND (p_start_date IS NULL OR l.created_at >= p_start_date)
        AND (p_end_date IS NULL OR l.created_at <= p_end_date)
    ORDER BY 
        l.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;