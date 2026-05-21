CREATE OR REPLACE FUNCTION public.increment_lead_score(p_lead_id UUID, p_inc INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.ai_lead_scores (lead_id, score_value, classification, last_update)
  VALUES (p_lead_id, p_inc, 'cold', now())
  ON CONFLICT (lead_id) DO UPDATE SET
    score_value = LEAST(100, ai_lead_scores.score_value + p_inc),
    classification = CASE 
      WHEN LEAST(100, ai_lead_scores.score_value + p_inc) > 70 THEN 'hot'
      WHEN LEAST(100, ai_lead_scores.score_value + p_inc) > 30 THEN 'warm'
      ELSE 'cold'
    END,
    last_update = now();
END;
$$;
