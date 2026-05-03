-- Adicionar colunas de hierarquia na tabela profiles usando 'id' como referência
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'vendedor',
ADD COLUMN IF NOT EXISTS gestor_id UUID REFERENCES public.profiles(id);

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_profiles_gestor_id ON public.profiles(gestor_id);

-- Atualizar RLS para a tabela profiles
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Permitir que cada um veja seu próprio perfil
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

-- Admin pode ver tudo
CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Gestores e Supervisores podem ver sua equipe direta
CREATE POLICY "Managers and Supervisors can view their team profiles" 
ON public.profiles FOR SELECT 
USING (
  gestor_id = auth.uid()
);

-- Atualizar RLS para a tabela cobrancas
-- Primeiro remover política antiga se existir
DROP POLICY IF EXISTS "Users can view their own cobrancas" ON public.cobrancas;

-- Admin vê tudo
CREATE POLICY "Admins can view all cobrancas"
ON public.cobrancas FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Usuário vê o seu
CREATE POLICY "Users can view their own cobrancas"
ON public.cobrancas FOR SELECT
USING (user_id = auth.uid());

-- Gestores veem de sua equipe
CREATE POLICY "Managers can view team cobrancas"
ON public.cobrancas FOR SELECT
USING (
  user_id IN (
    SELECT id FROM public.profiles WHERE gestor_id = auth.uid()
  )
);

-- Garantir que o usuário atual seja admin para testar
UPDATE public.profiles SET role = 'admin' WHERE id = auth.uid();
