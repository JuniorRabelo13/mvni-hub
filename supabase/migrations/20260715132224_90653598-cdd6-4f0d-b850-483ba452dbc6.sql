-- Limpeza: remover configuração legada do Asaas
DELETE FROM public.configuracoes WHERE chave = 'asaas_api_key';

-- Limpeza: remover colunas duplicadas de mvno_pagamentos
-- (pix_qrcode/pix_copia_cola eram duplicatas de pix_qr_code_base64/pix_copia_e_cola)
ALTER TABLE public.mvno_pagamentos DROP COLUMN IF EXISTS pix_qrcode;
ALTER TABLE public.mvno_pagamentos DROP COLUMN IF EXISTS pix_copia_cola;