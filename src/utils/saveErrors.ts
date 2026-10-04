export function getSaveErrorMessage(error: unknown): string {
  const detail = error as { code?: string; message?: string } | null;
  const message = detail?.message || '';
  if (detail?.code === '42501' || /row-level security|permission denied/i.test(message)) {
    return 'Não foi possível salvar nesta empresa. Confira sua empresa ativa e suas permissões de acesso.';
  }
  if (/fetch|network|load failed/i.test(message)) {
    return 'Não foi possível salvar no servidor. Verifique a conexão e tente novamente. O cadastro ainda não foi salvo.';
  }
  if (message.startsWith('Selecione uma empresa')) return message;
  return 'Não foi possível salvar. Confira os campos e tente novamente. O cadastro ainda não foi salvo.';
}
