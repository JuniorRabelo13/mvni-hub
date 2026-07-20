
-- Ajuste 2: consolidar `planos` → `saas_plans`
-- 1) Adicionar coluna features em saas_plans se ausente
ALTER TABLE public.saas_plans ADD COLUMN IF NOT EXISTS features jsonb DEFAULT '[]'::jsonb;

-- 2) Copiar features do plano legado (se houver) para saas_plans com mesmo id
UPDATE public.saas_plans s
SET features = COALESCE(p.features, '[]'::jsonb)
FROM public.planos p
WHERE s.id = p.id AND (s.features IS NULL OR s.features = '[]'::jsonb OR s.features = 'null'::jsonb);

-- 3) Remapear FK: apontar clientes.plano_id para saas_plans (drop antigo se existir, criar novo)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.clientes'::regclass
    AND conname = 'clientes_plano_id_fkey'
  ) THEN
    ALTER TABLE public.clientes DROP CONSTRAINT clientes_plano_id_fkey;
  END IF;
END $$;

-- Zerar plano_id que não existe em saas_plans, para permitir criar a FK
UPDATE public.clientes c
SET plano_id = NULL
WHERE c.plano_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.saas_plans s WHERE s.id = c.plano_id);

ALTER TABLE public.clientes
  ADD CONSTRAINT clientes_plano_id_fkey
  FOREIGN KEY (plano_id) REFERENCES public.saas_plans(id) ON DELETE SET NULL;

-- 4) Remover tabela legada `planos`
DROP TABLE IF EXISTS public.planos CASCADE;
