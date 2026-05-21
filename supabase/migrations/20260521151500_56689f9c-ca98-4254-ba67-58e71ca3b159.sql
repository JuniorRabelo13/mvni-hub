-- Função para busca de similaridade de cosseno para RAG
CREATE OR REPLACE FUNCTION public.match_ai_context(
  query_embedding VECTOR(1536),
  match_threshold FLOAT,
  match_count INT
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ace.id,
    ace.content,
    ace.metadata,
    1 - (ace.embedding <=> query_embedding) AS similarity
  FROM public.ai_context_embeddings ace
  WHERE ace.is_active = true AND 1 - (ace.embedding <=> query_embedding) > match_threshold
  ORDER BY ace.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
