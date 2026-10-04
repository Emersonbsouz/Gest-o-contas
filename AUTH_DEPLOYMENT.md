# Autenticação e publicação

O endereço de produção é https://gest-o-contas.vercel.app/.
O endereço da branch `migration/supabase` é um preview antigo, pode exigir
autenticação na Vercel e não deve ser distribuído como acesso ao sistema atual.

## Supabase e Vercel

- Projeto Supabase: `gvyqdcridjxvjtkfsqvf` (Gestor de Contas).
- Na Vercel, conferir `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`.
  O código mantém os valores públicos desse projeto como padrão. Se houver
  variáveis definidas, elas prevalecem e devem pertencer ao mesmo projeto.
- Nunca usar uma chave `service_role` ou secret em variáveis `VITE_`.
- Variáveis do Vite são incorporadas durante o build: republicar após alterá-las.
- No Supabase, Authentication → URL Configuration:
  - Site URL: `https://gest-o-contas.vercel.app`
  - Redirect URLs: permitir `https://gest-o-contas.vercel.app` e
    `https://gest-o-contas.vercel.app/`.
  - Permitir somente previews efetivamente utilizados para testes; evitar um
    wildcard para todos os sites da Vercel.
- Cadastro e recuperação usam `window.location.origin` como retorno.
  Login com e-mail/senha não usa redirects ou Google OAuth.
- Confirmar que o projeto está `ACTIVE_HEALTHY`. Um projeto pausado pode deixar
  o domínio da API indisponível e impedir todas as tentativas de login.

## Recuperação de senha

O evento `PASSWORD_RECOVERY` abre o formulário de nova senha, antes do acesso
às empresas. A alteração ocorre por `supabase.auth.updateUser`, usando a sessão
validada pelo Supabase. Recarregar a página na mesma aba mantém o formulário;
salvar a senha ou sair encerra o modo de recuperação.

Após a migração, as credenciais precisam existir no Supabase Auth. A senha do
Firebase não deve ser presumida como migrada. Uma senha esquecida deve ser
recuperada pelo próprio usuário, sem criar contas duplicadas ou trocar UUIDs.

## Validação

Instalar com `pnpm install --frozen-lockfile`, depois executar `pnpm test`,
`pnpm lint` e `pnpm build`. Os testes usam um cliente de autenticação simulado;
não enviam e-mails, não alteram senhas reais nem criam dados no projeto.

Para validar em produção, o titular deve testar login com sua conta, solicitar
a recuperação e concluir a alteração pelo e-mail. Não registrar credenciais
nos logs ou no repositório.

Referência: https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail
