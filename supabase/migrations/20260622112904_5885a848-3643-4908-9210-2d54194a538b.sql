
-- ===== ROLES =====
CREATE TYPE public.app_role AS ENUM ('admin', 'diretor', 'analista', 'gestor_obra');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_self_read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_self_update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_self_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_roles_self_read" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.has_any_dashboard_access(_user_id UUID)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id)
$$;

-- Auto-create profile + default role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'analista');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===== DOMAIN TABLES =====
CREATE TABLE public.empreendimentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cidade TEXT,
  estado TEXT,
  tipo TEXT,
  status TEXT,
  data_lancamento DATE,
  data_entrega_prevista DATE,
  data_entrega_real DATE,
  total_unidades INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.empreendimentos TO authenticated;
GRANT ALL ON public.empreendimentos TO service_role;
ALTER TABLE public.empreendimentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "empreendimentos_read_authenticated" ON public.empreendimentos FOR SELECT TO authenticated
  USING (public.has_any_dashboard_access(auth.uid()));

CREATE TABLE public.vgv_vendas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empreendimento_id UUID REFERENCES public.empreendimentos(id) ON DELETE CASCADE,
  mes_referencia DATE,
  vgv_lancado NUMERIC(15,2),
  vgv_vendido NUMERIC(15,2),
  unidades_vendidas INTEGER,
  unidades_distratadas INTEGER,
  ticket_medio NUMERIC(12,2),
  vso_percentual NUMERIC(5,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.vgv_vendas TO authenticated;
GRANT ALL ON public.vgv_vendas TO service_role;
ALTER TABLE public.vgv_vendas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vgv_vendas_read" ON public.vgv_vendas FOR SELECT TO authenticated
  USING (public.has_any_dashboard_access(auth.uid()));

CREATE TABLE public.andamento_obras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empreendimento_id UUID REFERENCES public.empreendimentos(id) ON DELETE CASCADE,
  mes_referencia DATE,
  evolucao_fisica_percentual NUMERIC(5,2),
  evolucao_financeira_percentual NUMERIC(5,2),
  desvio_cronograma_dias INTEGER,
  status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.andamento_obras TO authenticated;
GRANT ALL ON public.andamento_obras TO service_role;
ALTER TABLE public.andamento_obras ENABLE ROW LEVEL SECURITY;
CREATE POLICY "andamento_obras_read" ON public.andamento_obras FOR SELECT TO authenticated
  USING (public.has_any_dashboard_access(auth.uid()));

CREATE TABLE public.indicadores_financeiros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  periodo DATE,
  tipo_periodo TEXT,
  ativo_circulante NUMERIC(15,2),
  ativo_nao_circulante NUMERIC(15,2),
  ativo_total NUMERIC(15,2),
  passivo_circulante NUMERIC(15,2),
  passivo_nao_circulante NUMERIC(15,2),
  passivo_total NUMERIC(15,2),
  patrimonio_liquido NUMERIC(15,2),
  liquidez_corrente NUMERIC(8,4),
  liquidez_seca NUMERIC(8,4),
  liquidez_imediata NUMERIC(8,4),
  divida_bruta NUMERIC(15,2),
  divida_liquida NUMERIC(15,2),
  indice_endividamento_geral NUMERIC(5,2),
  cobertura_juros NUMERIC(8,4),
  receita_bruta NUMERIC(15,2),
  cpv NUMERIC(15,2),
  margem_bruta_percentual NUMERIC(5,2),
  ebitda NUMERIC(15,2),
  margem_ebitda_percentual NUMERIC(5,2),
  lucro_liquido NUMERIC(15,2),
  margem_liquida_percentual NUMERIC(5,2),
  roe NUMERIC(5,2),
  roa NUMERIC(5,2),
  roic NUMERIC(5,2),
  saldo_caixa NUMERIC(15,2),
  entradas_periodo NUMERIC(15,2),
  saidas_periodo NUMERIC(15,2),
  burn_rate NUMERIC(15,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.indicadores_financeiros TO authenticated;
GRANT ALL ON public.indicadores_financeiros TO service_role;
ALTER TABLE public.indicadores_financeiros ENABLE ROW LEVEL SECURITY;
-- only admin, diretor, analista can view financial data (not gestor_obra)
CREATE POLICY "indicadores_financeiros_read" ON public.indicadores_financeiros FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'diretor')
    OR public.has_role(auth.uid(), 'analista')
  );

CREATE TABLE public.fluxo_caixa_projecao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mes_referencia DATE,
  cenario TEXT,
  entradas_previstas NUMERIC(15,2),
  saidas_previstas NUMERIC(15,2),
  saldo_projetado NUMERIC(15,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.fluxo_caixa_projecao TO authenticated;
GRANT ALL ON public.fluxo_caixa_projecao TO service_role;
ALTER TABLE public.fluxo_caixa_projecao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fluxo_caixa_projecao_read" ON public.fluxo_caixa_projecao FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'diretor')
    OR public.has_role(auth.uid(), 'analista')
  );

-- ===== CHAT =====
CREATE TABLE public.chat_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Nova conversa',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_threads TO authenticated;
GRANT ALL ON public.chat_threads TO service_role;
ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chat_threads_own" ON public.chat_threads FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.chat_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "chat_messages_own" ON public.chat_messages FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_chat_messages_thread ON public.chat_messages(thread_id, created_at);
CREATE INDEX idx_chat_threads_user ON public.chat_threads(user_id, updated_at DESC);
CREATE INDEX idx_vgv_vendas_mes ON public.vgv_vendas(mes_referencia);
CREATE INDEX idx_indicadores_periodo ON public.indicadores_financeiros(periodo);
