ALTER TABLE public.comissoes_mensais 
ADD COLUMN IF NOT EXISTS clientes_diretos_ativos INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS clientes_indiretos_ativos INTEGER DEFAULT 0;