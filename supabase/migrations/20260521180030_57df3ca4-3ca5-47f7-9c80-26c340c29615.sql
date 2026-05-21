-- Função para buscar jobs com lock (concorrência segura)
CREATE OR REPLACE FUNCTION public.get_next_jobs(p_queue TEXT, p_worker_id UUID, p_limit INTEGER DEFAULT 1)
RETURNS SETOF public.queue_jobs AS $$
DECLARE
    v_job_ids UUID[];
BEGIN
    -- Selecionar IDs primeiro com FOR UPDATE SKIP LOCKED
    SELECT ARRAY(
        SELECT id FROM public.queue_jobs
        WHERE queue_name = p_queue
          AND status = 'pending'
          AND run_at <= now()
        ORDER BY priority ASC, created_at ASC
        LIMIT p_limit
        FOR UPDATE SKIP LOCKED
    ) INTO v_job_ids;

    IF array_length(v_job_ids, 1) > 0 THEN
        UPDATE public.queue_jobs
        SET 
            status = 'processing',
            started_at = now(),
            worker_id = p_worker_id,
            attempts = attempts + 1
        WHERE id = ANY(v_job_ids);
        
        RETURN QUERY SELECT * FROM public.queue_jobs WHERE id = ANY(v_job_ids);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Função para completar job e atualizar métricas
CREATE OR REPLACE FUNCTION public.complete_job(p_job_id UUID)
RETURNS VOID AS $$
DECLARE
    v_queue TEXT;
    v_latency INTERVAL;
BEGIN
    UPDATE public.queue_jobs
    SET 
        status = 'completed',
        finished_at = now()
    WHERE id = p_job_id
    RETURNING queue_name, (now() - started_at) INTO v_queue, v_latency;

    -- Atualizar métricas (Upsert simples para demonstração)
    INSERT INTO public.queue_metrics (queue_name, jobs_processed, avg_latency_ms, measured_at)
    VALUES (v_queue, 1, EXTRACT(EPOCH FROM v_latency) * 1000, now())
    ON CONFLICT (id) DO UPDATE SET 
        jobs_processed = queue_metrics.jobs_processed + 1;
END;
$$ LANGUAGE plpgsql;

-- Função para falhar job e gerenciar retry/DLQ
CREATE OR REPLACE FUNCTION public.fail_job(p_job_id UUID, p_error TEXT)
RETURNS VOID AS $$
DECLARE
    v_job RECORD;
BEGIN
    SELECT * FROM public.queue_jobs WHERE id = p_job_id INTO v_job;

    IF v_job.attempts < v_job.max_attempts THEN
        -- Retry com backoff
        UPDATE public.queue_jobs
        SET 
            status = 'pending',
            run_at = public.calculate_next_run(attempts),
            error_message = p_error,
            last_error_at = now(),
            worker_id = NULL
        WHERE id = p_job_id;
    ELSE
        -- Mover para Dead Letter Queue
        UPDATE public.queue_jobs SET status = 'failed', finished_at = now() WHERE id = p_job_id;
        
        INSERT INTO public.queue_dead_letters (original_job_id, queue_name, payload, error_log)
        VALUES (v_job.id, v_job.queue_name, v_job.payload, jsonb_build_object('error', p_error, 'final_attempt_at', now()));
    END IF;
END;
$$ LANGUAGE plpgsql;
