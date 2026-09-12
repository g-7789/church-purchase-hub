-- ROLES
CREATE TYPE public.app_role AS ENUM ('manutencao','compras','encarregado','recebimento','financeiro','admin');
CREATE TYPE public.status_solicitacao AS ENUM ('solicitado','em_cotacao','aguardando_aprovacao','aprovado','comprado','recebido','concluido','cancelado');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL DEFAULT '',
  setor TEXT NOT NULL DEFAULT 'Manutenção',
  telefone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "user_roles_select_all" ON public.user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "user_roles_admin_manage" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- novo usuário cria perfil e papel padrão
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, setor)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email,'@',1)), COALESCE(NEW.raw_user_meta_data->>'setor','Manutenção'));
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'manutencao'))
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- FORNECEDORES
CREATE TABLE public.fornecedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  contato TEXT,
  whatsapp TEXT,
  categoria TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fornecedores TO authenticated;
GRANT ALL ON public.fornecedores TO service_role;
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fornecedores_select" ON public.fornecedores FOR SELECT TO authenticated USING (true);
CREATE POLICY "fornecedores_write" ON public.fornecedores FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'compras') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'compras') OR public.has_role(auth.uid(),'admin'));

-- SOLICITACOES
CREATE TABLE public.solicitacoes_compra (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item TEXT NOT NULL,
  quantidade NUMERIC NOT NULL DEFAULT 1,
  unidade TEXT NOT NULL DEFAULT 'un',
  motivo TEXT,
  solicitante_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.status_solicitacao NOT NULL DEFAULT 'solicitado',
  valor_final NUMERIC,
  cotacao_escolhida_id UUID,
  prazo_desejado DATE,
  aprovado_por UUID REFERENCES auth.users(id),
  aprovado_em TIMESTAMPTZ,
  recebido_por UUID REFERENCES auth.users(id),
  recebido_em TIMESTAMPTZ,
  concluido_em TIMESTAMPTZ,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.solicitacoes_compra TO authenticated;
GRANT ALL ON public.solicitacoes_compra TO service_role;
ALTER TABLE public.solicitacoes_compra ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sol_select" ON public.solicitacoes_compra FOR SELECT TO authenticated USING (true);
CREATE POLICY "sol_insert" ON public.solicitacoes_compra FOR INSERT TO authenticated WITH CHECK (solicitante_id = auth.uid());
CREATE POLICY "sol_update" ON public.solicitacoes_compra FOR UPDATE TO authenticated USING (
  solicitante_id = auth.uid()
  OR public.has_role(auth.uid(),'compras')
  OR public.has_role(auth.uid(),'encarregado')
  OR public.has_role(auth.uid(),'recebimento')
  OR public.has_role(auth.uid(),'financeiro')
  OR public.has_role(auth.uid(),'admin')
) WITH CHECK (true);
CREATE POLICY "sol_delete" ON public.solicitacoes_compra FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR (solicitante_id = auth.uid() AND status = 'solicitado'));

-- COTACOES
CREATE TABLE public.cotacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitacao_id UUID NOT NULL REFERENCES public.solicitacoes_compra(id) ON DELETE CASCADE,
  fornecedor_id UUID REFERENCES public.fornecedores(id) ON DELETE SET NULL,
  valor NUMERIC NOT NULL,
  prazo_entrega_dias INTEGER,
  observacoes TEXT,
  registrado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cotacoes TO authenticated;
GRANT ALL ON public.cotacoes TO service_role;
ALTER TABLE public.cotacoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cot_select" ON public.cotacoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "cot_write" ON public.cotacoes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'compras') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'compras') OR public.has_role(auth.uid(),'admin'));

-- ANEXOS
CREATE TABLE public.anexos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitacao_id UUID NOT NULL REFERENCES public.solicitacoes_compra(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL DEFAULT 'cotacao',
  caminho TEXT NOT NULL,
  descricao TEXT,
  enviado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.anexos TO authenticated;
GRANT ALL ON public.anexos TO service_role;
ALTER TABLE public.anexos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anexos_select" ON public.anexos FOR SELECT TO authenticated USING (true);
CREATE POLICY "anexos_insert" ON public.anexos FOR INSERT TO authenticated WITH CHECK (enviado_por = auth.uid());
CREATE POLICY "anexos_delete" ON public.anexos FOR DELETE TO authenticated USING (enviado_por = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- HISTORICO
CREATE TABLE public.historico_solicitacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  solicitacao_id UUID NOT NULL REFERENCES public.solicitacoes_compra(id) ON DELETE CASCADE,
  status_anterior public.status_solicitacao,
  status_novo public.status_solicitacao NOT NULL,
  usuario_id UUID REFERENCES auth.users(id),
  comentario TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.historico_solicitacao TO authenticated;
GRANT ALL ON public.historico_solicitacao TO service_role;
ALTER TABLE public.historico_solicitacao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hist_select" ON public.historico_solicitacao FOR SELECT TO authenticated USING (true);
CREATE POLICY "hist_insert" ON public.historico_solicitacao FOR INSERT TO authenticated WITH CHECK (usuario_id = auth.uid());

-- CONFIGURACOES
CREATE TABLE public.configuracoes (
  chave TEXT PRIMARY KEY,
  valor NUMERIC NOT NULL,
  descricao TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.configuracoes TO authenticated;
GRANT INSERT, UPDATE ON public.configuracoes TO authenticated;
GRANT ALL ON public.configuracoes TO service_role;
ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conf_select" ON public.configuracoes FOR SELECT TO authenticated USING (true);
CREATE POLICY "conf_write" ON public.configuracoes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

INSERT INTO public.configuracoes (chave, valor, descricao) VALUES
  ('limite_aprovacao_automatica', 500, 'Compras até este valor (R$) são aprovadas automaticamente'),
  ('minimo_cotacoes', 3, 'Número mínimo de cotações por solicitação');

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER trg_sol_updated BEFORE UPDATE ON public.solicitacoes_compra FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();