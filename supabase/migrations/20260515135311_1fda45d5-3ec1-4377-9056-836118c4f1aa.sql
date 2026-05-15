-- 1. Tabela para monitorar a saúde dos workers (Heartbeat)
CREATE TABLE IF NOT EXISTS public.import_heartbeats (
    worker_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    last_ping TIMESTAMPTZ DEFAULT now(),
    active_jobs UUID[] DEFAULT '{}'
);

-- 2. Função para reivindicar um LOTE de chunks para processamento paralelo
CREATE OR REPLACE FUNCTION public.claim_batch_import_chunks(p_batch_size integer DEFAULT 1000)
RETURNS SETOF public.import_chunks
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    UPDATE public.import_chunks c
    SET status = 'processing',
        updated_at = now()
    FROM (
        SELECT c2.id
        FROM public.import_chunks c2
        JOIN public.import_jobs j2 ON c2.job_id = j2.id
        WHERE c2.status = 'pending'
        AND j2.cancelado = false
        AND j2.status = 'processing'
        AND (c2.proxima_tentativa IS NULL OR c2.proxima_tentativa <= now())
        AND c2.tentativas < 3
        ORDER BY c2.created_at ASC
        FOR UPDATE SKIP LOCKED
        LIMIT p_batch_size
    ) sub
    WHERE c.id = sub.id
    RETURNING c.*;
END;
$$;

-- 3. Função de UPSERT massivo para alta performance (Meta: 500+ registros/seg)
-- Esta função aceita um array de JSONB e insere na tabela clientes/linhas via SQL dinâmico
CREATE OR REPLACE FUNCTION public.upsert_import_batch(p_payloads jsonb[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    payload jsonb;
BEGIN
    -- Exemplo otimizado para a tabela 'clientes' (ajustar conforme colunas reais do CSV)
    -- O uso de UNNEST e jsonb_to_recordset permite processar 1000 registros em uma única transação
    INSERT INTO public.clientes (nome, cpf, telefone, email, user_id, ativo)
    SELECT 
        (item->>'nome')::text,
        (item->>'cpf')::text,
        (item->>'telefone')::text,
        (item->>'email')::text,
        (item->>'user_id')::uuid,
        COALESCE((item->>'ativo')::boolean, true)
    FROM unnest(p_payloads) AS item
    ON CONFLICT (cpf) DO UPDATE SET
        nome = EXCLUDED.nome,
        telefone = EXCLUDED.telefone,
        email = EXCLUDED.email,
        updated_at = now();
        
    -- Registrar heartbeat do progresso
    INSERT INTO public.import_heartbeats (worker_id, last_ping)
    VALUES (gen_random_uuid(), now())
    ON CONFLICT (worker_id) DO UPDATE SET last_ping = now();
END;
$$;

-- 4. Função para atualizar heartbeat
CREATE OR REPLACE FUNCTION public.update_import_heartbeat(p_worker_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.import_heartbeats (worker_id, last_ping)
    VALUES (p_worker_id, now())
    ON CONFLICT (worker_id) DO UPDATE SET last_ping = now();
END;
$$;