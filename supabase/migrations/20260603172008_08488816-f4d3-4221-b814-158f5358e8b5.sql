CREATE TABLE public.produtos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  nome text NOT NULL,
  descricao_comercial text,
  status text NOT NULL DEFAULT 'preparado',
  produto_principal boolean NOT NULL DEFAULT false,
  valor_mensal numeric(10,2),
  custo_operacional numeric(10,2),
  comissao_ativacao numeric(10,2),
  comissao_recorrente numeric(10,2),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT produtos_status_check CHECK (status IN ('ativo','preparado','inativo'))
);

GRANT SELECT ON public.produtos TO authenticated;
GRANT ALL ON public.produtos TO service_role;

ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view produtos"
  ON public.produtos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Master admin can insert produtos"
  ON public.produtos FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'master_admin'::app_role));

CREATE POLICY "Master admin can update produtos"
  ON public.produtos FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'master_admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'master_admin'::app_role));

CREATE POLICY "Master admin can delete produtos"
  ON public.produtos FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'master_admin'::app_role));

CREATE TRIGGER trg_produtos_updated_at
  BEFORE UPDATE ON public.produtos
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

INSERT INTO public.produtos (slug, nome, descricao_comercial, status, produto_principal, valor_mensal, custo_operacional, comissao_ativacao, comissao_recorrente) VALUES
  ('linha-celular', 'Linha celular', 'Produto principal atual do MVNI Hub para venda de linhas celulares recorrentes.', 'ativo', true, 99.90, 49.90, 85.00, 20.00),
  ('banda-larga-movel', 'Banda larga móvel', 'Produto futuro preparado para expansão do catálogo recorrente.', 'preparado', false, NULL, NULL, NULL, NULL),
  ('rastreamento-veicular', 'Rastreamento veicular', 'Produto futuro preparado para expansão do catálogo recorrente.', 'preparado', false, NULL, NULL, NULL, NULL);