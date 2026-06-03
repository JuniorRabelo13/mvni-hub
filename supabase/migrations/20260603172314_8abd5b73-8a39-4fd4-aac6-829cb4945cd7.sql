ALTER TABLE public.assinaturas
  ADD COLUMN IF NOT EXISTS produto_id uuid NULL REFERENCES public.produtos(id);

ALTER TABLE public.itens_comissao
  ADD COLUMN IF NOT EXISTS produto_id uuid NULL REFERENCES public.produtos(id);

CREATE INDEX IF NOT EXISTS idx_assinaturas_produto_id ON public.assinaturas(produto_id);
CREATE INDEX IF NOT EXISTS idx_itens_comissao_produto_id ON public.itens_comissao(produto_id);