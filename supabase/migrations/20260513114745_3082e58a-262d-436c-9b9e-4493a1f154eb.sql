-- Function to generate a unique 8-character referral code
CREATE OR REPLACE FUNCTION public.gerar_codigo_indicacao()
RETURNS TEXT AS $$
DECLARE
    novo_codigo TEXT;
    codigo_existe BOOLEAN;
BEGIN
    LOOP
        -- Generate 8 chars string (A-Z, 0-9)
        novo_codigo := upper(substring(md5(random()::text) from 1 for 8));
        
        -- Check if it exists in usuarios table
        SELECT EXISTS (SELECT 1 FROM public.usuarios WHERE codigo_indicacao = novo_codigo) INTO codigo_existe;
        
        -- Exit loop if unique
        IF NOT codigo_existe THEN
            RETURN novo_codigo;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger function to fill codigo_indicacao if empty
CREATE OR REPLACE FUNCTION public.handle_referral_code_insert()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.codigo_indicacao IS NULL OR NEW.codigo_indicacao = '' OR NEW.codigo_indicacao LIKE '%-%' THEN
        NEW.codigo_indicacao := public.gerar_codigo_indicacao();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create the trigger on usuarios table
DROP TRIGGER IF EXISTS trigger_codigo_indicacao ON public.usuarios;
CREATE TRIGGER trigger_codigo_indicacao
BEFORE INSERT ON public.usuarios
FOR EACH ROW
EXECUTE FUNCTION public.handle_referral_code_insert();

-- Update existing records if they have UUID-style codes (optional safety but requested logic focus is on new)
-- Note: The user said "before INSERT", so we focus on the trigger.
COMMENT ON FUNCTION public.gerar_codigo_indicacao() IS 'Generates a unique 8-character alphanumeric referral code';