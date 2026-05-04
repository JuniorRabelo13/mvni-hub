-- Revogar execução pública para funções SECURITY DEFINER (Melhor prática de segurança)
REVOKE EXECUTE ON FUNCTION public.cleanup_import_data() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cancel_import_job(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.claim_next_import_chunk() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.fail_import_chunk(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.resume_import_job(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_import_errors(uuid) FROM PUBLIC;

-- Conceder permissão apenas para papéis autenticados (opcional, dependendo de quem chama)
-- Como as funções rodam em RLS ou RPC via cliente, o papel 'authenticated' precisa de acesso se for chamado via RPC.
GRANT EXECUTE ON FUNCTION public.cancel_import_job(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resume_import_job(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_import_errors(uuid) TO authenticated;
