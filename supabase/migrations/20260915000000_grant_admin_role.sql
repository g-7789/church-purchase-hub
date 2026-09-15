-- Concede o papel 'admin' à conta gustavowssilva2007@gmail.com, dando visão
-- e gestão completas do sistema (todas as solicitações, fornecedores,
-- cotações, configurações e papéis de outros usuários), em vez de uma
-- visão restrita a um único setor/papel.
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE email = 'gustavowssilva2007@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
