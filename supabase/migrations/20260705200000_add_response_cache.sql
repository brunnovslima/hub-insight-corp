
CREATE TABLE public.response_cache (
  cache_key TEXT PRIMARY KEY,
  response TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '10 minutes')
);

CREATE INDEX idx_response_cache_expires ON public.response_cache(expires_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.response_cache TO service_role;
ALTER TABLE public.response_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "response_cache_service_role" ON public.response_cache FOR ALL TO service_role
  USING (true) WITH CHECK (true);
