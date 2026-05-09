
ALTER FUNCTION public.cleanup_old_imports() SET search_path = public;
ALTER FUNCTION public.enqueue_new_lead_whatsapp() SET search_path = public;
ALTER FUNCTION public.fn_whatsapp_on_lead_insert() SET search_path = public;
ALTER FUNCTION public.calculate_next_day_volume(integer, double precision, double precision) SET search_path = public;
ALTER FUNCTION public.update_whatsapp_agent_activity() SET search_path = public;

DROP POLICY IF EXISTS service_role_queue ON public.whatsapp_queue;
CREATE POLICY "deny_all_non_service" ON public.whatsapp_queue
  AS RESTRICTIVE FOR ALL TO authenticated, anon
  USING (false) WITH CHECK (false);

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_cobranca_paga() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_set_updated_at() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_profile_role() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_profile_role_escalation() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_rpc_rate_limit(uuid, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_rpc_call(uuid, text, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.check_and_register_whatsapp_send(text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sms_claim_messages(integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sms_deduct_credits(uuid, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sms_process_inbound() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sms_trigger_campaign(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.claim_next_import_chunk() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.fail_import_chunk(uuid, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_job_progress(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_import_data() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_imports() FROM anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.cancel_import_job(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.resume_import_job(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_import_errors(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_configuracoes_safe() FROM anon;
REVOKE EXECUTE ON FUNCTION public.log_security_event(uuid, text, text, text) FROM anon;
