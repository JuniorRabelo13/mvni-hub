
-- Sprint A1: Consolidação de identidade — profiles como fonte única
-- Adiciona colunas necessárias em profiles, mantém usuarios operacional.

-- 1) Colunas em profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS codigo_indicacao TEXT,
  ADD COLUMN IF NOT EXISTS cadastro_pago_em TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cpf TEXT;

-- 2) Backfill de codigo_indicacao para linhas existentes
UPDATE public.profiles
SET codigo_indicacao = upper(substring(md5(random()::text || id::text) from 1 for 8))
WHERE codigo_indicacao IS NULL;

-- 3) Índices únicos (após backfill para não quebrar)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_codigo_indicacao_key
  ON public.profiles (codigo_indicacao) WHERE codigo_indicacao IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_cpf_key
  ON public.profiles (cpf) WHERE cpf IS NOT NULL;

-- 4) gerar_codigo_indicacao passa a checar profiles
CREATE OR REPLACE FUNCTION public.gerar_codigo_indicacao()
RETURNS text
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  novo_codigo TEXT;
  existe BOOLEAN;
BEGIN
  LOOP
    novo_codigo := upper(substring(md5(random()::text) from 1 for 8));
    SELECT EXISTS (
      SELECT 1 FROM public.profiles WHERE codigo_indicacao = novo_codigo
    ) INTO existe;
    IF NOT existe THEN
      RETURN novo_codigo;
    END IF;
  END LOOP;
END;
$$;

-- 5) handle_new_user popula codigo_indicacao, cpf e role vindo do metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_indicador UUID;
  v_cpf TEXT;
  v_role TEXT;
BEGIN
  BEGIN
    v_indicador := NULLIF(NEW.raw_user_meta_data->>'indicador_id','')::UUID;
  EXCEPTION WHEN OTHERS THEN v_indicador := NULL;
  END;

  v_cpf  := NULLIF(NEW.raw_user_meta_data->>'cpf','');
  v_role := COALESCE(NULLIF(NEW.raw_user_meta_data->>'role',''), 'user');

  INSERT INTO public.profiles (id, nome, email, telefone, indicador_id, role, codigo_indicacao, cpf)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email,'@',1)),
    NEW.email,
    NEW.raw_user_meta_data->>'telefone',
    v_indicador,
    v_role,
    public.gerar_codigo_indicacao(),
    v_cpf
  );

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.sms_credits (user_id, saldo) VALUES (NEW.id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 6) handle_payment_confirmed passa a ler profiles.indicador_id (motor de comissão)
CREATE OR REPLACE FUNCTION public.handle_payment_confirmed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_cliente_user_id uuid;
  v_indicador_direto uuid;
  v_indicador_indireto uuid;
  v_ja_pagou_antes boolean;
  v_valor_ativacao numeric;
  v_valor_recorrencia numeric;
  v_valor_bonus numeric;
  v_carencia int;
BEGIN
  IF NEW.status = 'confirmado'
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'confirmado')
  THEN
    NEW.paid_at := COALESCE(NEW.paid_at, now());

    SELECT valor INTO v_valor_ativacao   FROM public.config_comissoes WHERE chave = 'ativacao';
    SELECT valor INTO v_valor_recorrencia FROM public.config_comissoes WHERE chave = 'recorrencia';
    SELECT valor INTO v_valor_bonus      FROM public.config_comissoes WHERE chave = 'bonus_indireto';
    SELECT valor::int INTO v_carencia    FROM public.config_comissoes WHERE chave = 'carencia_dias';

    SELECT EXISTS (
      SELECT 1 FROM public.mvno_pagamentos
      WHERE cliente_id = NEW.cliente_id AND status = 'confirmado' AND id <> NEW.id
    ) INTO v_ja_pagou_antes;

    SELECT user_id INTO v_cliente_user_id FROM public.clientes WHERE id = NEW.cliente_id;

    IF v_cliente_user_id IS NOT NULL THEN
      SELECT indicador_id INTO v_indicador_direto FROM public.profiles WHERE id = v_cliente_user_id;

      IF NOT v_ja_pagou_antes THEN
        IF v_indicador_direto IS NOT NULL THEN
          BEGIN
            PERFORM public.creditar_wallet(v_indicador_direto, 'credito_ativacao', v_valor_ativacao, NEW.id, v_carencia);
          EXCEPTION WHEN unique_violation THEN NULL;
          END;
        END IF;
      ELSE
        IF v_indicador_direto IS NOT NULL THEN
          BEGIN
            PERFORM public.creditar_wallet(v_indicador_direto, 'credito_recorrencia', v_valor_recorrencia, NEW.id, v_carencia);
          EXCEPTION WHEN unique_violation THEN NULL;
          END;

          SELECT indicador_id INTO v_indicador_indireto FROM public.profiles WHERE id = v_indicador_direto;
          IF v_indicador_indireto IS NOT NULL THEN
            BEGIN
              PERFORM public.creditar_wallet(v_indicador_indireto, 'credito_bonus', v_valor_bonus, NEW.id, v_carencia);
            EXCEPTION WHEN unique_violation THEN NULL;
            END;
          END IF;
        END IF;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 7) FK explícita para PostgREST embutir profiles em comissoes_mensais
ALTER TABLE public.comissoes_mensais
  DROP CONSTRAINT IF EXISTS fk_comissoes_mensais_representante_profile;
ALTER TABLE public.comissoes_mensais
  ADD  CONSTRAINT fk_comissoes_mensais_representante_profile
  FOREIGN KEY (representante_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
