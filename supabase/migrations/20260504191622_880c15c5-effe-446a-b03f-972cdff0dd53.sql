-- 1. Sincronizar profiles.role com user_roles
CREATE OR REPLACE FUNCTION public.sync_profile_role()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.profiles
    SET role = NEW.role
    WHERE id = NEW.user_id;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_sync_profile_role ON public.user_roles;
CREATE TRIGGER tr_sync_profile_role
AFTER INSERT OR UPDATE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.sync_profile_role();

-- 2. Corrigir handle_new_user para preencher role inicial no profile
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

  INSERT INTO public.profiles (id, nome, email, telefone, indicador_id, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email,'@',1)),
    NEW.email,
    NEW.raw_user_meta_data->>'telefone',
    v_indicador,
    'user'
  );

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Criar entrada de créditos SMS vazia
  INSERT INTO public.sms_credits (user_id, saldo) VALUES (NEW.id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 3. Blindagem de sms_deduct_credits contra valores negativos
CREATE OR REPLACE FUNCTION public.sms_deduct_credits(p_user_id UUID, p_amount INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_saldo INTEGER;
BEGIN
    IF p_amount <= 0 THEN
        RETURN TRUE; -- Nada a descontar
    END IF;

    SELECT saldo INTO v_saldo FROM public.sms_credits WHERE user_id = p_user_id FOR UPDATE;
    
    IF v_saldo IS NULL THEN
        INSERT INTO public.sms_credits (user_id, saldo) VALUES (p_user_id, 0);
        v_saldo := 0;
    END IF;

    IF v_saldo >= p_amount THEN
        UPDATE public.sms_credits SET saldo = saldo - p_amount WHERE user_id = p_user_id;
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$;

-- 4. Garantir que asaas_api_key nunca vaze via RLS em nenhuma circunstância
-- A função get_configuracoes_safe já cuida disso, mas o RLS é o backup final
DROP POLICY IF EXISTS "Authenticated can view non-sensitive settings" ON public.configuracoes;
CREATE POLICY "Authenticated can view non-sensitive settings"
ON public.configuracoes FOR SELECT
USING (
    has_role(auth.uid(), 'admin'::app_role) 
    OR 
    (chave NOT ILIKE '%key%' AND chave NOT ILIKE '%token%' AND chave NOT ILIKE '%secret%')
);
