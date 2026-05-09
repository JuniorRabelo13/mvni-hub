
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_cobranca_paga() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.tg_set_updated_at() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sync_profile_role() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.prevent_profile_role_escalation() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.check_rpc_rate_limit(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_rpc_call(uuid, text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.check_and_register_whatsapp_send(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sms_claim_messages(integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sms_deduct_credits(uuid, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sms_process_inbound() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sms_trigger_campaign(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.claim_next_import_chunk() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.fail_import_chunk(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_job_progress(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cleanup_import_data() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_imports() FROM PUBLIC;

REVOKE EXECUTE ON FUNCTION public.cancel_import_job(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.resume_import_job(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_import_errors(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_configuracoes_safe() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_security_event(uuid, text, text, text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.cancel_import_job(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resume_import_job(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_import_errors(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_configuracoes_safe() TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_security_event(uuid, text, text, text) TO authenticated;
