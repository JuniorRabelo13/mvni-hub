-- Tabela de permissões
CREATE TABLE IF NOT EXISTS public.master_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Permissões padrão
INSERT INTO public.master_permissions (name, description) VALUES
('all_access', 'Acesso total ao sistema'),
('manage_users', 'Gerenciar usuários e permissões'),
('manage_finance', 'Gerenciar gateways e financeiro'),
('view_auditoria', 'Visualizar logs de auditoria'),
('manage_infra', 'Gerenciar infraestrutura e limites'),
('manage_whatsapp', 'Gerenciar conexões de WhatsApp')
ON CONFLICT (name) DO NOTHING;

-- Vínculo entre perfis e permissões
CREATE TABLE IF NOT EXISTS public.profile_permissions (
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES public.master_permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (profile_id, permission_id)
);

-- Tabela de logs de atividade (se não existir de outras migrações)
CREATE TABLE IF NOT EXISTS public.user_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    details JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Adicionar coluna de bloqueio se não existir
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_blocked') THEN
        ALTER TABLE public.profiles ADD COLUMN is_blocked BOOLEAN DEFAULT false;
    END IF;
END $$;

-- RLS
ALTER TABLE public.master_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;

-- Políticas: Apenas 'master' pode ver/gerenciar permissões
CREATE POLICY "Master profiles can view permissions" ON public.master_permissions
FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'master'));

CREATE POLICY "Master profiles can manage permissions" ON public.master_permissions
FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'master'));

CREATE POLICY "Master profiles can manage profile_permissions" ON public.profile_permissions
FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'master'));

CREATE POLICY "Users can view their own activity logs" ON public.user_activity_logs
FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "Master profiles can view all activity logs" ON public.user_activity_logs
FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'master'));
