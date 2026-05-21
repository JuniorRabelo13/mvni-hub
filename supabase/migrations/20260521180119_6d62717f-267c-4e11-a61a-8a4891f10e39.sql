-- Trigger para atualizar ping de worker automaticamente
CREATE OR REPLACE FUNCTION public.handle_worker_ping()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_ping = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_worker_ping
BEFORE UPDATE ON public.queue_workers
FOR EACH ROW
EXECUTE FUNCTION public.handle_worker_ping();

-- Impedir deleção acidental de jobs pendentes (Proteção de Integridade)
CREATE OR REPLACE FUNCTION public.protect_pending_jobs()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = 'processing' THEN
        RAISE EXCEPTION 'Cannot delete a job while it is being processed';
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_protect_jobs
BEFORE DELETE ON public.queue_jobs
FOR EACH ROW
EXECUTE FUNCTION public.protect_pending_jobs();
