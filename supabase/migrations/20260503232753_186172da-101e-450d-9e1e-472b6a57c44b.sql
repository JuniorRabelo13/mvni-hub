-- Create settings table
CREATE TABLE public.configuracoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chave TEXT UNIQUE NOT NULL,
  valor TEXT NOT NULL,
  descricao TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read settings
CREATE POLICY "Anyone can view settings" 
ON public.configuracoes FOR SELECT 
TO authenticated 
USING (true);

-- Only admins can modify settings
CREATE POLICY "Admins can modify settings" 
ON public.configuracoes FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Insert default values
INSERT INTO public.configuracoes (chave, valor, descricao) VALUES
('valor_plano', '99.90', 'Valor padrão do plano mensal'),
('comissao_venda', '85.00', 'Valor da comissão na primeira venda'),
('comissao_recorrencia', '20.00', 'Valor da comissão recorrente mensal'),
('valor_minimo_saque', '50.00', 'Valor mínimo para solicitação de saque'),
('asaas_api_key', '', 'Chave de API do Asaas (Sandbox ou Produção)')
ON CONFLICT (chave) DO NOTHING;
