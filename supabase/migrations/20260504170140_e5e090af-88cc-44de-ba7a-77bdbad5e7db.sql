-- Revoke execute from public/anon for the security function
REVOKE EXECUTE ON FUNCTION public.log_security_event(UUID, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_security_event(UUID, TEXT, TEXT, TEXT) FROM anon;

-- Grant to authenticated users
GRANT EXECUTE ON FUNCTION public.log_security_event(UUID, TEXT, TEXT, TEXT) TO authenticated;
