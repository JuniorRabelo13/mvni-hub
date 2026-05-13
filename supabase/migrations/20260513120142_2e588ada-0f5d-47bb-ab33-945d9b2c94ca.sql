-- Create the comissoes_mensais table
CREATE TABLE IF NOT EXISTS public.comissoes_mensais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    representante_id UUID REFERENCES public.usuarios(id) NOT NULL,
    mes_referencia TEXT NOT NULL, -- Format YYYY-MM
    valor_total NUMERIC NOT NULL DEFAULT 0,
    status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'cancelado')),
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE(representante_id, mes_referencia)
);

-- Create the itens_comissao table
CREATE TABLE IF NOT EXISTS public.itens_comissao (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comissao_id UUID REFERENCES public.comissoes_mensais(id) ON DELETE CASCADE,
    representante_id UUID REFERENCES public.usuarios(id) NOT NULL,
    cliente_id UUID REFERENCES public.clientes(id),
    tipo TEXT NOT NULL CHECK (tipo IN ('ativacao', 'recorrencia_direta', 'recorrencia_indireta', 'bonus')),
    valor NUMERIC NOT NULL DEFAULT 0,
    mes_referencia TEXT NOT NULL,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.comissoes_mensais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_comissao ENABLE ROW LEVEL SECURITY;

-- Policies for comissoes_mensais
CREATE POLICY "Users can view their own monthly commissions" 
ON public.comissoes_mensais FOR SELECT USING (auth.uid() = representante_id);

CREATE POLICY "Admins can manage all monthly commissions" 
ON public.comissoes_mensais FOR ALL USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'master_admin')
);

-- Policies for itens_comissao
CREATE POLICY "Users can view their own commission items" 
ON public.itens_comissao FOR SELECT USING (auth.uid() = representante_id);

CREATE POLICY "Admins can manage all commission items" 
ON public.itens_comissao FOR ALL USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'master_admin')
);

-- Trigger for updated_at on comissoes_mensais
CREATE TRIGGER update_comissoes_mensais_updated_at
BEFORE UPDATE ON public.comissoes_mensais
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add comments
COMMENT ON TABLE public.comissoes_mensais IS 'Monthly commission totals for representatives';
COMMENT ON TABLE public.itens_comissao IS 'Detailed items for commissions (activations, recurring, etc)';