
ALTER FUNCTION public.check_and_register_whatsapp_send(text) SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
