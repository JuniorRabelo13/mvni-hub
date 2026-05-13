-- Add missing columns to the usuarios table to support the listing of representatives
ALTER TABLE public.usuarios 
ADD COLUMN IF NOT EXISTS nome TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS telefone TEXT,
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'representante',
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ativo';

-- Add comments for documentation
COMMENT ON COLUMN public.usuarios.nome IS 'Full name of the user';
COMMENT ON COLUMN public.usuarios.email IS 'Email address of the user';
COMMENT ON COLUMN public.usuarios.telefone IS 'Phone number of the user';
COMMENT ON COLUMN public.usuarios.role IS 'Role of the user in the system';
COMMENT ON COLUMN public.usuarios.status IS 'Current status of the user account';