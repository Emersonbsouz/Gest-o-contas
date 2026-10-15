
import { afterEach, expect, test, vi } from 'vitest';
const clients=vi.hoisted(()=>({remote:vi.fn(()=>({mode:'remote'})),local:vi.fn(()=>({mode:'offline'}))}));
vi.mock('@supabase/supabase-js',()=>({createClient:clients.remote}));
vi.mock('./localClient',()=>({createLocalClient:clients.local}));
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();vi.resetModules();vi.clearAllMocks();});
test('production uses real Supabase with session refresh and does not activate offline access',async()=>{
 vi.stubEnv('DEV',false);
 vi.stubEnv('VITE_SUPABASE_URL','https://production-project.supabase.co');
 vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY','publishable-test');
 vi.stubGlobal('window',{location:{hostname:'gest-o-contas.vercel.app'}});
 const {supabase}=await import('./supabase');
 expect(supabase).toEqual({mode:'remote'});
 expect(clients.local).not.toHaveBeenCalled();
 expect(clients.remote).toHaveBeenCalledWith('https://production-project.supabase.co','publishable-test',expect.objectContaining({auth:expect.objectContaining({persistSession:true,autoRefreshToken:true,detectSessionInUrl:true})}));
});
test.each(['localhost','127.0.0.1','[::1]'])('local preview at %s cannot use the production database',async hostname=>{
 vi.stubEnv('DEV',false);vi.stubEnv('VITE_SUPABASE_URL','https://production-project.supabase.co');
 vi.stubGlobal('window',{location:{hostname}});
 const {supabase}=await import('./supabase');
 expect(supabase).toEqual({mode:'offline'});
 expect(clients.remote).not.toHaveBeenCalled();
});
test('development accessed over LAN remains offline',async()=>{
 vi.stubEnv('DEV',true);vi.stubGlobal('window',{location:{hostname:'192.168.0.10'}});
 const {supabase}=await import('./supabase');
 expect(supabase).toEqual({mode:'offline'});expect(clients.remote).not.toHaveBeenCalled();
});
