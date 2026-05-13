-- Create the timestamp update function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the usuarios table as requested
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    codigo_indicacao TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
    indicado_por UUID REFERENCES public.usuarios(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies
CREATE POLICY "Users can view their own record" ON public.usuarios
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own record" ON public.usuarios
    FOR UPDATE USING (auth.uid() = id);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_usuarios_updated_at ON public.usuarios;
CREATE TRIGGER update_usuarios_updated_at
BEFORE UPDATE ON public.usuarios
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add comments
COMMENT ON TABLE public.usuarios IS 'Table to store user-specific system data like referral codes';
COMMENT ON COLUMN public.usuarios.codigo_indicacao IS 'Unique referral code for the user';
COMMENT ON COLUMN public.usuarios.indicado_por IS 'Reference to the user who referred this user';