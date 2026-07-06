
-- ============================================================
-- Migration: Add multi-tenant empresas structure
-- Creates: empresas, integracoes, sync_logs
-- Adds empresa_id to: profiles, empreendimentos, indicadores_financeiros, fluxo_caixa_projecao
-- Updates RLS policies for tenant isolation
-- ============================================================

-- ============================================================
-- 1. EMPRESAS (tenant root)
-- ============================================================
CREATE TABLE public.empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  logo_url TEXT,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.empresas (id, slug, nome)
VALUES ('00000000-0000-0000-0000-000000000001', 'hub-insight', 'Hub Insight Corp');

-- ============================================================
-- 2. PROFILES + empresa_id
-- ============================================================
ALTER TABLE public.profiles ADD COLUMN empresa_id UUID REFERENCES public.empresas(id);
UPDATE public.profiles SET empresa_id = '00000000-0000-0000-0000-000000000001';
ALTER TABLE public.profiles ALTER COLUMN empresa_id SET NOT NULL;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_empresa_id UUID;
BEGIN
  v_empresa_id := (NEW.raw_user_meta_data->>'empresa_id')::UUID;
  IF v_empresa_id IS NULL THEN
    v_empresa_id := '00000000-0000-0000-0000-000000000001';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, empresa_id)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), v_empresa_id);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'analista');
  RETURN NEW;
END;
$$;

-- ============================================================
-- 3. EMPREENDIMENTOS + empresa_id
-- ============================================================
ALTER TABLE public.empreendimentos ADD COLUMN empresa_id UUID REFERENCES public.empresas(id);
UPDATE public.empreendimentos SET empresa_id = '00000000-0000-0000-0000-000000000001';
ALTER TABLE public.empreendimentos ALTER COLUMN empresa_id SET NOT NULL;

-- ============================================================
-- 4. INDICADORES FINANCEIROS + empresa_id
-- ============================================================
ALTER TABLE public.indicadores_financeiros ADD COLUMN empresa_id UUID REFERENCES public.empresas(id);
UPDATE public.indicadores_financeiros SET empresa_id = '00000000-0000-0000-0000-000000000001';
ALTER TABLE public.indicadores_financeiros ALTER COLUMN empresa_id SET NOT NULL;

-- ============================================================
-- 5. FLUXO CAIXA PROJECAO + empresa_id
-- ============================================================
ALTER TABLE public.fluxo_caixa_projecao ADD COLUMN empresa_id UUID REFERENCES public.empresas(id);
UPDATE public.fluxo_caixa_projecao SET empresa_id = '00000000-0000-0000-0000-000000000001';
ALTER TABLE public.fluxo_caixa_projecao ALTER COLUMN empresa_id SET NOT NULL;

-- ============================================================
-- 6. INTEGRACOES (ERP connections per empresa)
-- ============================================================
CREATE TABLE public.integracoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('api_rest', 'csv_import', 'sql_direct', 'webhook')),
  provider TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  active BOOLEAN NOT NULL DEFAULT true,
  ultima_sincronizacao TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 7. SYNC_LOGS (ingestion history)
-- ============================================================
CREATE TABLE public.sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integracao_id UUID REFERENCES public.integracoes(id) ON DELETE SET NULL,
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('running', 'success', 'error')),
  initiated_by TEXT NOT NULL DEFAULT 'system',
  records_criados INTEGER NOT NULL DEFAULT 0,
  records_atualizados INTEGER NOT NULL DEFAULT 0,
  erro_texto TEXT,
  summary JSONB,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- ============================================================
-- 8. RLS - DROP OLD POLICIES
-- ============================================================
DROP POLICY IF EXISTS "empreendimentos_read_authenticated" ON public.empreendimentos;
DROP POLICY IF EXISTS "vgv_vendas_read" ON public.vgv_vendas;
DROP POLICY IF EXISTS "andamento_obras_read" ON public.andamento_obras;
DROP POLICY IF EXISTS "indicadores_financeiros_read" ON public.indicadores_financeiros;
DROP POLICY IF EXISTS "fluxo_caixa_projecao_read" ON public.fluxo_caixa_projecao;
DROP POLICY IF EXISTS "profiles_self_read" ON public.profiles;
DROP POLICY IF EXISTS "profiles_self_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_self_insert" ON public.profiles;

-- ============================================================
-- 9. RLS - NEW TENANT-ISOLATED POLICIES
-- ============================================================

CREATE POLICY "empresas_self_read" ON public.empresas FOR SELECT TO authenticated
  USING (id = (SELECT p.empresa_id FROM public.profiles p WHERE p.id = auth.uid()));

CREATE POLICY "profiles_self_read" ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);
CREATE POLICY "profiles_self_update" ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id);
CREATE POLICY "profiles_self_insert" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "empreendimentos_tenant" ON public.empreendimentos FOR SELECT TO authenticated
  USING (
    empresa_id = (SELECT p.empresa_id FROM public.profiles p WHERE p.id = auth.uid())
    AND public.has_any_dashboard_access(auth.uid())
  );

CREATE POLICY "vgv_vendas_tenant" ON public.vgv_vendas FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.empreendimentos e
      WHERE e.id = vgv_vendas.empreendimento_id
      AND e.empresa_id = (SELECT p.empresa_id FROM public.profiles p WHERE p.id = auth.uid())
    )
    AND public.has_any_dashboard_access(auth.uid())
  );

CREATE POLICY "andamento_obras_tenant" ON public.andamento_obras FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.empreendimentos e
      WHERE e.id = andamento_obras.empreendimento_id
      AND e.empresa_id = (SELECT p.empresa_id FROM public.profiles p WHERE p.id = auth.uid())
    )
    AND public.has_any_dashboard_access(auth.uid())
  );

CREATE POLICY "indicadores_financeiros_tenant" ON public.indicadores_financeiros FOR SELECT TO authenticated
  USING (
    empresa_id = (SELECT p.empresa_id FROM public.profiles p WHERE p.id = auth.uid())
    AND (public.has_role(auth.uid(), 'admin')
      OR public.has_role(auth.uid(), 'diretor')
      OR public.has_role(auth.uid(), 'analista'))
  );

CREATE POLICY "fluxo_caixa_projecao_tenant" ON public.fluxo_caixa_projecao FOR SELECT TO authenticated
  USING (
    empresa_id = (SELECT p.empresa_id FROM public.profiles p WHERE p.id = auth.uid())
    AND (public.has_role(auth.uid(), 'admin')
      OR public.has_role(auth.uid(), 'diretor')
      OR public.has_role(auth.uid(), 'analista'))
  );

-- ============================================================
-- 10. RLS - NEW TABLES
-- ============================================================
ALTER TABLE public.integracoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "integracoes_service_role" ON public.integracoes FOR ALL TO service_role
  USING (true) WITH CHECK (true);
CREATE POLICY "sync_logs_service_role" ON public.sync_logs FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ============================================================
-- 11. GRANTS
-- ============================================================
GRANT SELECT ON public.empresas TO authenticated;
GRANT ALL ON public.empresas TO service_role;

GRANT ALL ON public.integracoes TO service_role;
GRANT ALL ON public.sync_logs TO service_role;

-- ============================================================
-- 12. INDEXES
-- ============================================================
CREATE INDEX idx_profiles_empresa ON public.profiles(empresa_id);
CREATE INDEX idx_empreendimentos_empresa ON public.empreendimentos(empresa_id);
CREATE INDEX idx_indicadores_financeiros_empresa ON public.indicadores_financeiros(empresa_id);
CREATE INDEX idx_fluxo_caixa_projecao_empresa ON public.fluxo_caixa_projecao(empresa_id);
CREATE INDEX idx_integracoes_empresa ON public.integracoes(empresa_id);
CREATE INDEX idx_sync_logs_empresa ON public.sync_logs(empresa_id);
CREATE INDEX idx_sync_logs_integracao ON public.sync_logs(integracao_id);
CREATE INDEX idx_empresas_slug ON public.empresas(slug);
