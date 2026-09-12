import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSessao } from "@/hooks/useSessao";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PAPEL_LABEL, type Papel } from "@/lib/dominio";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Compras Manutenção" },
      { name: "description", content: "Acesse o sistema de compras do setor de Manutenção." },
      { property: "og:title", content: "Entrar — Compras Manutenção" },
      {
        property: "og:description",
        content: "Acesse o sistema de compras do setor de Manutenção.",
      },
    ],
  }),
  component: Autenticacao,
});

function Autenticacao() {
  const navigate = useNavigate();
  const { session, carregando } = useSessao();
  const [modo, setModo] = useState<"entrar" | "criar">("entrar");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [setor, setSetor] = useState("Manutenção");
  const [papel, setPapel] = useState<Papel>("manutencao");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!carregando && session) void navigate({ to: "/hoje", replace: true });
  }, [carregando, session, navigate]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEnviando(true);
    try {
      if (modo === "entrar") {
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
        if (error) throw error;
        void navigate({ to: "/hoje", replace: true });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: senha,
          options: {
            emailRedirectTo: window.location.origin,
            data: { nome, setor, role: papel },
          },
        });
        if (error) throw error;
        if (data.session) {
          void navigate({ to: "/hoje", replace: true });
        } else {
          toast.success("Cadastro criado. Confirme o e-mail para entrar.");
          setModo("entrar");
        }
      }
    } catch (erro) {
      const msg = erro instanceof Error ? erro.message : "Não foi possível continuar.";
      toast.error(
        msg.includes("Invalid login credentials") ? "E-mail ou senha incorretos." : msg,
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-card-foreground">
          {modo === "entrar" ? "Entrar" : "Criar conta"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Compras do setor de Manutenção</p>

        <form className="mt-6 space-y-4" onSubmit={enviar}>
          {modo === "criar" && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="nome">Nome completo</Label>
                <Input
                  id="nome"
                  className="h-12"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="setor">Setor</Label>
                <Input
                  id="setor"
                  className="h-12"
                  value={setor}
                  onChange={(e) => setSetor(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Função no processo</Label>
                <Select value={papel} onValueChange={(v) => setPapel(v as Papel)}>
                  <SelectTrigger className="h-12 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(PAPEL_LABEL) as Papel[]).map((p) => (
                      <SelectItem key={p} value={p}>
                        {PAPEL_LABEL[p]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              className="h-12"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="senha">Senha</Label>
            <Input
              id="senha"
              type="password"
              className="h-12"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              minLength={6}
              required
            />
          </div>
          <Button type="submit" className="h-14 w-full text-base" disabled={enviando}>
            {enviando ? "Aguarde..." : modo === "entrar" ? "Entrar" : "Criar conta"}
          </Button>
        </form>

        <button
          type="button"
          className="mt-4 w-full text-sm text-primary underline-offset-4 hover:underline"
          onClick={() => setModo(modo === "entrar" ? "criar" : "entrar")}
        >
          {modo === "entrar" ? "Não tenho conta — criar agora" : "Já tenho conta — entrar"}
        </button>
      </div>
    </div>
  );
}
