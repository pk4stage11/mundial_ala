import "server-only";
import { createClient } from "@supabase/supabase-js";

// Cliente con service-role: SOLO se usa en el servidor (server actions / componentes server).
// Ignora RLS, por eso nunca debe exponerse al navegador.
export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
