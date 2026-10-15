// Offline development adapter. No network requests or real authentication.
type Row = Record<string, any>;
const key = 'gestao-contas:offline-tables:v1';
const user = { id: 'local-test-user', email: 'teste@local.invalid', user_metadata: { full_name: 'Teste local' } };
export function createLocalClient() {
  const read = (): Record<string, Row[]> => JSON.parse(localStorage.getItem(key) || '{}');
  const listeners = new Set<(event: string, session: any) => void>();
  const session = () => sessionStorage.getItem('gestao-local-signed-out') ? null : { user };
  const notify = (event: string) => listeners.forEach(fn => fn(event, session()));
  const unsupported = async () => ({ data: null, error: new Error('Recurso de autenticação indisponível no modo de testes local.') });
  return {
    auth: {
      getSession: async () => ({ data: { session: session() }, error: null }),
      onAuthStateChange: (fn: (event: string, session: any) => void) => {
        listeners.add(fn);
        return { data: { subscription: { unsubscribe: () => listeners.delete(fn) } } };
      },
      signInWithPassword: async () => { sessionStorage.removeItem('gestao-local-signed-out'); notify('SIGNED_IN'); return { data: { session: session() }, error: null }; },
      signUp: unsupported,
      resetPasswordForEmail: unsupported,
      updateUser: unsupported,
      signOut: async () => { sessionStorage.setItem('gestao-local-signed-out', 'true'); notify('SIGNED_OUT'); return { error: null }; },
    },
    from(table: string) {
      if (!['companies', 'company_members', 'company_documents'].includes(table)) throw new Error('Tabela local não suportada: ' + table);
      let operation = 'select';
      let values: Row[] = [];
      let conflict = 'id';
      let one = false;
      let sort: { column: string; ascending: boolean } | undefined;
      const filters: Array<(row: Row) => boolean> = [];
      let result: any;
      const query: any = {
        select: () => query,
        insert: (value: Row | Row[]) => { operation = 'insert'; values = Array.isArray(value) ? value : [value]; return query; },
        upsert: (value: Row | Row[], options?: { onConflict?: string }) => { operation = 'upsert'; values = Array.isArray(value) ? value : [value]; conflict = options?.onConflict || 'id'; return query; },
        update: (value: Row) => { operation = 'update'; values = [value]; return query; },
        delete: () => { operation = 'delete'; return query; },
        eq: (column: string, value: any) => { filters.push(row => typeof row[column] === 'object' && typeof value === 'string' ? JSON.stringify(row[column]) === value : row[column] === value); return query; },
        neq: (column: string, value: any) => { filters.push(row => row[column] !== value); return query; },
        in: (column: string, value: any[]) => { filters.push(row => value.includes(row[column])); return query; },
        order: (column: string, options?: { ascending?: boolean }) => { sort = { column, ascending: options?.ascending !== false }; return query; },
        single: () => { one = true; return query; },
        maybeSingle: () => { one = true; return query; },
        then(resolve: any, reject: any) {
          if (!result) result = Promise.resolve().then(() => {
            const db = read();
            const rows = db[table] || [];
            const matches = (row: Row) => filters.every(fn => fn(row));
            let selected = rows.filter(matches);
            if (operation === 'insert' || operation === 'upsert') {
              selected = values.map(value => {
                const columns = conflict.split(',');
                const index = operation === 'upsert' ? rows.findIndex(row => columns.every(col => row[col] === value[col])) : -1;
                const row = { id: crypto.randomUUID(), created_at: new Date().toISOString(), ...(index >= 0 ? rows[index] : {}), ...value };
                if (operation === 'insert' && table === 'company_documents' && rows.some(r=>r.company_id===value.company_id && r.collection_name===value.collection_name && r.doc_id===value.doc_id)) throw new Error('Este registro já existe.');
                if (index >= 0) rows[index] = row; else rows.push(row);
                return row;
              });
            } else if (operation === 'update') selected.forEach(row => Object.assign(row, values[0]));
            db[table] = operation === 'delete' ? rows.filter(row => !matches(row)) : rows;
            if (operation !== 'select') localStorage.setItem(key, JSON.stringify(db));
            if (sort) { const {column, ascending} = sort; selected.sort((a,b) => String(a[column]).localeCompare(String(b[column])) * (ascending ? 1 : -1)); }
            return { data: one ? selected[0] || null : selected, error: null };
          });
          return result.then(resolve, reject);
        },
      };
      return query;
    },
  };
}
