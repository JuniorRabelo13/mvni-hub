
-- ===== chip_lotes =====
CREATE TABLE public.chip_lotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  operadora text NOT NULL DEFAULT 'Vivo',
  quantidade_total integer NOT NULL DEFAULT 0 CHECK (quantidade_total >= 0),
  quantidade_disponivel integer NOT NULL DEFAULT 0 CHECK (quantidade_disponivel >= 0),
  data_recebimento timestamptz DEFAULT now(),
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chip_lotes TO authenticated;
GRANT ALL ON public.chip_lotes TO service_role;
ALTER TABLE public.chip_lotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage chip_lotes" ON public.chip_lotes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'master_admin') OR public.is_master_admin(auth.uid()))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'master_admin') OR public.is_master_admin(auth.uid()));

CREATE INDEX idx_chip_lotes_operadora ON public.chip_lotes(operadora);
CREATE TRIGGER trg_chip_lotes_updated_at BEFORE UPDATE ON public.chip_lotes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== chip_estoque =====
CREATE TABLE public.chip_estoque (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operadora text NOT NULL DEFAULT 'Vivo',
  iccid text UNIQUE NOT NULL,
  numero_linha text,
  produto_id uuid REFERENCES public.produtos(id),
  status text NOT NULL DEFAULT 'disponivel' CHECK (status IN ('disponivel','reservado','enviado','com_representante','ativado','cancelado','perdido','devolvido')),
  representante_id uuid REFERENCES auth.users(id),
  cliente_id uuid,
  lote_id uuid REFERENCES public.chip_lotes(id),
  data_entrada timestamptz DEFAULT now(),
  data_reserva timestamptz,
  data_envio timestamptz,
  data_recebimento timestamptz,
  data_ativacao timestamptz,
  data_devolucao timestamptz,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chip_estoque TO authenticated;
GRANT ALL ON public.chip_estoque TO service_role;
ALTER TABLE public.chip_estoque ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage chip_estoque" ON public.chip_estoque
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'master_admin') OR public.is_master_admin(auth.uid()))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'master_admin') OR public.is_master_admin(auth.uid()));

CREATE POLICY "Representante reads own chips" ON public.chip_estoque
  FOR SELECT TO authenticated
  USING (representante_id = auth.uid());

CREATE INDEX idx_chip_estoque_status ON public.chip_estoque(status);
CREATE INDEX idx_chip_estoque_operadora ON public.chip_estoque(operadora);
CREATE INDEX idx_chip_estoque_representante ON public.chip_estoque(representante_id);
CREATE INDEX idx_chip_estoque_iccid ON public.chip_estoque(iccid);
CREATE INDEX idx_chip_estoque_lote ON public.chip_estoque(lote_id);
CREATE INDEX idx_chip_estoque_produto ON public.chip_estoque(produto_id);
CREATE TRIGGER trg_chip_estoque_updated_at BEFORE UPDATE ON public.chip_estoque FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== chip_kits_representante =====
CREATE TABLE public.chip_kits_representante (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  representante_id uuid NOT NULL REFERENCES auth.users(id),
  tipo_kit text NOT NULL DEFAULT 'inicial' CHECK (tipo_kit IN ('inicial','reposicao_5','reposicao_10','manual')),
  quantidade_prevista integer NOT NULL DEFAULT 5 CHECK (quantidade_prevista >= 0),
  quantidade_enviada integer NOT NULL DEFAULT 0 CHECK (quantidade_enviada >= 0),
  operadora_prioritaria text NOT NULL DEFAULT 'Vivo',
  status text NOT NULL DEFAULT 'pendente_aprovacao' CHECK (status IN ('pendente_aprovacao','aprovado','enviado','recebido','bloqueado','cancelado','concluido')),
  motivo_bloqueio text,
  endereco_entrega text,
  codigo_rastreio text,
  data_solicitacao timestamptz DEFAULT now(),
  data_aprovacao timestamptz,
  data_envio timestamptz,
  data_recebimento timestamptz,
  aprovado_por uuid REFERENCES auth.users(id),
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chip_kits_representante TO authenticated;
GRANT ALL ON public.chip_kits_representante TO service_role;
ALTER TABLE public.chip_kits_representante ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage chip_kits" ON public.chip_kits_representante
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'master_admin') OR public.is_master_admin(auth.uid()))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'master_admin') OR public.is_master_admin(auth.uid()));

CREATE POLICY "Representante reads own kits" ON public.chip_kits_representante
  FOR SELECT TO authenticated
  USING (representante_id = auth.uid());

CREATE INDEX idx_chip_kits_representante ON public.chip_kits_representante(representante_id);
CREATE INDEX idx_chip_kits_status ON public.chip_kits_representante(status);
CREATE INDEX idx_chip_kits_tipo ON public.chip_kits_representante(tipo_kit);
CREATE TRIGGER trg_chip_kits_updated_at BEFORE UPDATE ON public.chip_kits_representante FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== chip_kit_itens =====
CREATE TABLE public.chip_kit_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kit_id uuid NOT NULL REFERENCES public.chip_kits_representante(id) ON DELETE CASCADE,
  chip_id uuid NOT NULL UNIQUE REFERENCES public.chip_estoque(id),
  representante_id uuid NOT NULL REFERENCES auth.users(id),
  status text NOT NULL DEFAULT 'vinculado' CHECK (status IN ('vinculado','enviado','recebido','ativado','devolvido','perdido','cancelado')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chip_kit_itens TO authenticated;
GRANT ALL ON public.chip_kit_itens TO service_role;
ALTER TABLE public.chip_kit_itens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage chip_kit_itens" ON public.chip_kit_itens
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'master_admin') OR public.is_master_admin(auth.uid()))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'master_admin') OR public.is_master_admin(auth.uid()));

CREATE POLICY "Representante reads own kit itens" ON public.chip_kit_itens
  FOR SELECT TO authenticated
  USING (representante_id = auth.uid());

CREATE INDEX idx_chip_kit_itens_kit ON public.chip_kit_itens(kit_id);
CREATE INDEX idx_chip_kit_itens_chip ON public.chip_kit_itens(chip_id);
CREATE INDEX idx_chip_kit_itens_representante ON public.chip_kit_itens(representante_id);
CREATE TRIGGER trg_chip_kit_itens_updated_at BEFORE UPDATE ON public.chip_kit_itens FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== chip_movimentacoes =====
CREATE TABLE public.chip_movimentacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chip_id uuid NOT NULL REFERENCES public.chip_estoque(id),
  representante_id uuid REFERENCES auth.users(id),
  cliente_id uuid,
  tipo_movimentacao text NOT NULL CHECK (tipo_movimentacao IN ('entrada_estoque','reservado','enviado_representante','recebido_representante','ativado_cliente','devolvido','perdido','cancelado','ajuste_manual')),
  status_anterior text,
  status_novo text,
  descricao text,
  criado_por uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chip_movimentacoes TO authenticated;
GRANT ALL ON public.chip_movimentacoes TO service_role;
ALTER TABLE public.chip_movimentacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage chip_movimentacoes" ON public.chip_movimentacoes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'master_admin') OR public.is_master_admin(auth.uid()))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'master_admin') OR public.is_master_admin(auth.uid()));

CREATE POLICY "Representante reads own movimentacoes" ON public.chip_movimentacoes
  FOR SELECT TO authenticated
  USING (representante_id = auth.uid());

CREATE INDEX idx_chip_mov_chip ON public.chip_movimentacoes(chip_id);
CREATE INDEX idx_chip_mov_representante ON public.chip_movimentacoes(representante_id);
CREATE INDEX idx_chip_mov_tipo ON public.chip_movimentacoes(tipo_movimentacao);
