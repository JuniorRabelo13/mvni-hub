-- Clean up existing plans to ensure only one remains
TRUNCATE TABLE public.planos CASCADE;
TRUNCATE TABLE public.saas_plans CASCADE;

-- Insert the official unique plan into both tables (for compatibility)
INSERT INTO public.planos (id, nome, valor, descricao, features, ativo)
VALUES (
  '00000000-0000-0000-0000-000000000001', 
  'Plano Premium', 
  99.90, 
  'Plano único oficial com acesso total a todos os recursos da plataforma.', 
  '["Acesso Total", "Suporte VIP", "WhatsApp Ilimitado", "Automação Enterprise"]'::jsonb, 
  true
);

INSERT INTO public.saas_plans (id, name, description, monthly_price, commission_rate, lines_limit, whatsapp_limit, automation_limit, is_active)
VALUES (
  '00000000-0000-0000-0000-000000000001', 
  'Plano Premium', 
  'Plano único oficial com acesso total a todos os recursos da plataforma.', 
  99.90, 
  85.00, 
  1, 
  1, 
  10000, 
  true
);

-- Update all existing clients to reference this unique plan
UPDATE public.clientes SET plano_id = '00000000-0000-0000-0000-000000000001';

-- Update all subscriptions to the official price
UPDATE public.assinaturas SET valor = 99.90;
