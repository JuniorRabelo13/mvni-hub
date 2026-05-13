DROP TRIGGER IF EXISTS trg_cobranca_paga ON public.cobrancas;
DROP FUNCTION IF EXISTS public.handle_cobranca_paga CASCADE;
DROP FUNCTION IF EXISTS public.get_global_metrics CASCADE;
ALTER TABLE public.comissoes DROP CONSTRAINT IF EXISTS comissoes_cobranca_id_fkey;
ALTER TABLE public.comissoes DROP COLUMN IF EXISTS cobranca_id;