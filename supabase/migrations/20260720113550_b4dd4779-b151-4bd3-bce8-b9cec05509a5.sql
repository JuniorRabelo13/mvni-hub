
CREATE OR REPLACE FUNCTION public.aprovar_anuncio(p_anuncio_id uuid)
RETURNS public.anuncios
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_anuncio public.anuncios;
  v_inicio date;
  v_fim date;
  v_dias int;
BEGIN
  IF NOT (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'master_admin'::app_role) OR is_master_admin(auth.uid())) THEN
    RAISE EXCEPTION 'Apenas admin pode aprovar anúncios' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_anuncio FROM public.anuncios WHERE id = p_anuncio_id AND status = 'pendente_aprovacao';
  IF v_anuncio.id IS NULL THEN
    RAISE EXCEPTION 'Anúncio não encontrado ou não está pendente de aprovação';
  END IF;

  v_dias := COALESCE(v_anuncio.dias_contratados, 7);
  v_inicio := COALESCE(v_anuncio.data_inicio, CURRENT_DATE);
  v_fim := COALESCE(v_anuncio.data_fim, v_inicio + (v_dias - 1));

  UPDATE public.anuncios
  SET status = CASE WHEN v_inicio <= CURRENT_DATE THEN 'ativo'::anuncio_status ELSE 'aprovado'::anuncio_status END,
      data_inicio = v_inicio,
      data_fim = v_fim,
      aprovado_por = auth.uid(),
      aprovado_em = now()
  WHERE id = p_anuncio_id
  RETURNING * INTO v_anuncio;

  RETURN v_anuncio;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.aprovar_anuncio(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.aprovar_anuncio(uuid) TO authenticated;
