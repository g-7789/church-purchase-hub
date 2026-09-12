import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Papel } from "@/lib/dominio";

type Perfil = { id: string; nome: string; setor: string; telefone: string | null };

type SessaoContexto = {
  session: Session | null;
  perfil: Perfil | null;
  papeis: Papel[];
  carregando: boolean;
  temPapel: (...p: Papel[]) => boolean;
  recarregar: () => Promise<void>;
  sair: () => Promise<void>;
};

const Ctx = createContext<SessaoContexto | null>(null);

export function SessaoProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [papeis, setPapeis] = useState<Papel[]>([]);
  const [carregando, setCarregando] = useState(true);

  async function carregarDados(userId: string | undefined) {
    if (!userId) {
      setPerfil(null);
      setPapeis([]);
      return;
    }
    const [{ data: p }, { data: r }] = await Promise.all([
      supabase.from("profiles").select("id, nome, setor, telefone").eq("id", userId).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);
    setPerfil((p as Perfil) ?? null);
    setPapeis(((r ?? []) as { role: Papel }[]).map((x) => x.role));
  }

  useEffect(() => {
    let ativo = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!ativo) return;
      setSession(data.session);
      await carregarDados(data.session?.user.id);
      setCarregando(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        void carregarDados(s?.user.id);
      }
    });
    return () => {
      ativo = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const valor: SessaoContexto = {
    session,
    perfil,
    papeis,
    carregando,
    temPapel: (...p) => p.some((x) => papeis.includes(x)),
    recarregar: () => carregarDados(session?.user.id),
    sair: async () => {
      await supabase.auth.signOut();
    },
  };

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useSessao() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSessao precisa estar dentro de SessaoProvider");
  return ctx;
}
