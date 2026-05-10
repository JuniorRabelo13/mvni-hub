INSERT INTO public.configuracoes (chave, valor, descricao) VALUES 
('whatsapp_api_url', 'https://api.z-api.io/instances/SUA_INSTANCIA/token/SEU_TOKEN/send-text', 'URL da API de WhatsApp'),
('whatsapp_api_token', 'TOKEN_AQUI', 'Token de Autenticação WhatsApp')
ON CONFLICT (chave) DO NOTHING;
