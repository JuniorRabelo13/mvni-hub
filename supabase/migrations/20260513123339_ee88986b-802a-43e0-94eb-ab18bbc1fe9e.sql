-- Enable the pg_cron extension if it's not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the cron job to call the edge function
-- Replace the URL with the correct endpoint for your project if necessary, 
-- but following the standard Supabase structure:
SELECT cron.schedule(
  'calcular-comissoes-mensais',
  '0 9 1 * *',
  $$
  SELECT
    net.http_post(
      url:='https://hmzqfcooxqucytxwljhg.supabase.co/functions/v1/calcular-comissoes-mes',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb
    ) as request_id;
  $$
);