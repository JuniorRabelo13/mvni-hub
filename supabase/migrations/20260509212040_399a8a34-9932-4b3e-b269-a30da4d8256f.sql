
CREATE SCHEMA IF NOT EXISTS extensions;
DROP EXTENSION IF EXISTS http;
CREATE EXTENSION http WITH SCHEMA extensions;
GRANT USAGE ON SCHEMA extensions TO anon, authenticated, service_role;
