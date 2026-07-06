-- As funções has_role e has_any_dashboard_access são usadas pelas políticas RLS
-- Precisam estar acessíveis para usuários authenticated, senão as policies
-- retornam false e nenhum dado é exibido.
GRANT EXECUTE ON FUNCTION public.has_any_dashboard_access(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
