-- Desabilitar triggers de sincronização
ALTER TABLE public.user_roles DISABLE TRIGGER tr_sync_profile_role;
ALTER TABLE public.profiles DISABLE TRIGGER prevent_profile_role_escalation_trg;

INSERT INTO public.user_roles (user_id, role)
VALUES ('4dfa3ff9-c24e-4d9d-8b51-5d8cf4bf7584', 'master_admin')
ON CONFLICT (user_id, role) DO UPDATE SET role = 'master_admin';

UPDATE public.profiles 
SET role = 'master_admin'::public.app_role 
WHERE id = '4dfa3ff9-c24e-4d9d-8b51-5d8cf4bf7584';

ALTER TABLE public.user_roles ENABLE TRIGGER tr_sync_profile_role;
ALTER TABLE public.profiles ENABLE TRIGGER prevent_profile_role_escalation_trg;
