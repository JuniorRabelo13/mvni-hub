
-- ENUMS
CREATE TYPE public.app_role AS ENUM ('admin', 'user');
CREATE TYPE public.user_status AS ENUM ('ativo', 'inativo');
CREATE TYPE public.cobranca_status AS ENUM ('pendente', 'pago', 'atrasado', 'cancelado');
CREATE TYPE public.linha_status AS ENUM ('ativa', 'suspensa', 'cancelada');
CREATE TYPE public.comissao_tipo AS ENUM ('venda', 'recorrencia');

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  indicador_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status public.user_status NOT NULL DEFAULT 'ativo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_profiles_indicador ON public.profiles(indicador_id);

-- USER ROLES
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- has_role (security definer, evita recursão RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

-- CLIENTES (carteira de cada usuário)
CREATE TABLE public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  cpf TEXT,
  telefone TEXT,
  email TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_clientes_user ON public.clientes(user_id);

-- LINHAS
CREATE TABLE public.linhas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  msisdn TEXT,
  plano TEXT NOT NULL DEFAULT 'Plano 99',
  valor NUMERIC(10,2) NOT NULL DEFAULT 99.90,
  status public.linha_status NOT NULL DEFAULT 'ativa',
  ativada_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_linhas_user ON public.linhas(user_id);
CREATE INDEX idx_linhas_cliente ON public.linhas(cliente_id);

-- COBRANCAS
CREATE TABLE public.cobrancas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  linha_id UUID NOT NULL REFERENCES public.linhas(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  valor NUMERIC(10,2) NOT NULL DEFAULT 99.90,
  vencimento DATE NOT NULL,
  status public.cobranca_status NOT NULL DEFAULT 'pendente',
  pago_em TIMESTAMPTZ,
  is_primeira BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_cobrancas_user ON public.cobrancas(user_id);
CREATE INDEX idx_cobrancas_status ON public.cobrancas(status);

-- COMISSOES (ganhos)
CREATE TABLE public.comissoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cobranca_id UUID NOT NULL REFERENCES public.cobrancas(id) ON DELETE CASCADE,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  tipo public.comissao_tipo NOT NULL,
  valor NUMERIC(10,2) NOT NULL,
  competencia DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (cobranca_id, tipo)
);
CREATE INDEX idx_comissoes_user ON public.comissoes(user_id);

-- updated_at trigger helper
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE TRIGGER trg_clientes_updated BEFORE UPDATE ON public.clientes
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- AUTO-CRIAR PROFILE NO SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_indicador UUID;
BEGIN
  BEGIN
    v_indicador := NULLIF(NEW.raw_user_meta_data->>'indicador_id','')::UUID;
  EXCEPTION WHEN OTHERS THEN v_indicador := NULL;
  END;

  INSERT INTO public.profiles (id, nome, email, telefone, indicador_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email,'@',1)),
    NEW.email,
    NEW.raw_user_meta_data->>'telefone',
    v_indicador
  );

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- AUTO-COMISSAO ao marcar cobrança como paga
CREATE OR REPLACE FUNCTION public.handle_cobranca_paga()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'pago' AND (OLD.status IS DISTINCT FROM 'pago') THEN
    NEW.pago_em := COALESCE(NEW.pago_em, now());
    -- Comissão de venda (apenas na primeira cobrança paga)
    IF NEW.is_primeira THEN
      INSERT INTO public.comissoes (user_id, cobranca_id, cliente_id, tipo, valor, competencia)
      VALUES (NEW.user_id, NEW.id, NEW.cliente_id, 'venda', 85.00, CURRENT_DATE)
      ON CONFLICT (cobranca_id, tipo) DO NOTHING;
    ELSE
      INSERT INTO public.comissoes (user_id, cobranca_id, cliente_id, tipo, valor, competencia)
      VALUES (NEW.user_id, NEW.id, NEW.cliente_id, 'recorrencia', 20.00, CURRENT_DATE)
      ON CONFLICT (cobranca_id, tipo) DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_cobranca_paga BEFORE UPDATE ON public.cobrancas
FOR EACH ROW EXECUTE FUNCTION public.handle_cobranca_paga();

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.linhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cobrancas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comissoes ENABLE ROW LEVEL SECURITY;

-- profiles: leitura para autenticados (necessário para árvore), update só do próprio
CREATE POLICY "profiles_read_authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_admin_all" ON public.profiles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- user_roles: usuário lê os próprios papéis; admin gerencia
CREATE POLICY "roles_read_own" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "roles_admin_write" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- clientes / linhas / cobrancas: dono ou admin
CREATE POLICY "clientes_owner" ON public.clientes FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "linhas_owner" ON public.linhas FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "cobrancas_owner" ON public.cobrancas FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- comissoes: leitura para dono/admin; insert/update apenas via trigger (negar app)
CREATE POLICY "comissoes_read_owner" ON public.comissoes FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "comissoes_admin_write" ON public.comissoes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
