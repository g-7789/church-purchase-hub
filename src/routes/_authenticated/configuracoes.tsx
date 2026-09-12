import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useSessao } from "@/hooks/useSessao";
import { obterConfiguracoes } from "@/lib/consultas";
import { PAPEL_LABEL, moeda } from "@/lib/dominio";

export const Route = createFileRoute("/_authenticated/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — Compras Manutenção" },
      { name: "description", content: "Faixa de valor para aprovação e mínimo de cotações." },
      { property: "og:title", content: "Configurações — Compras Manutenção" },
      {
        property: "og:description",
        content: "Faixa de valor para aprovação e mínimo de cotações.",
      },
    ],
  }),
  component: Configuracoes,
});

function Configuracoes() {
  const { perfil, papeis, temPapel } = useSessao();
  const queryClient = useQueryClient();
  const admin = temPapel("admin");
  const config = useQuery({ queryKey: ["configuracoes"], queryFn: obterConfiguracoes });
  const [limite, setLimite] = useState("");
  const [minimo, setMinimo] = useState("");

  useEffect(() => {
    if (config.data) {
      setLimite(String(config.data.limite));
      setMinimo(String(config.data.minimoCotacoes));
    }
  }, [config.data]);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("configuracoes").upsert([
      { chave: "limite_aprovacao_automatica", valor: Number(limite) },
      { chave: "minimo_cotacoes", valor: Number(minimo) },
    ]);
    if (error) {
      toast.error(error.message);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["configuracoes"] });
    toast.success("Configurações salvas.");
  }

  return (
    <AppShell titulo="Configurações">
      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Minha conta
        </h2>
        <p className="mt-2 font-medium">{perfil?.nome}</p>
        <p className="text-sm text-muted-foreground">
          {perfil?.setor} · {papeis.map((p) => PAPEL_LABEL[p]).join(", ") || "sem papel"}
        </p>
      </section>

      <section className="mt-5 rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Faixa de aprovação
        </h2>
        <p className="mt-2 text-sm text-foreground">
          Compras até {moeda(config.data?.limite ?? 0)} são aprovadas automaticamente. Acima disso,
          precisam do aval de um encarregado.
        </p>

        <form className="mt-4 space-y-4" onSubmit={salvar}>
          <div className="space-y-1.5">
            <Label htmlFor="limite">Valor limite (R$)</Label>
            <Input
              id="limite"
              className="h-12"
              type="number"
              min="0"
              step="0.01"
              value={limite}
              onChange={(e) => setLimite(e.target.value)}
              disabled={!admin}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="minimo">Mínimo de cotações por solicitação</Label>
            <Input
              id="minimo"
              className="h-12"
              type="number"
              min="1"
              value={minimo}
              onChange={(e) => setMinimo(e.target.value)}
              disabled={!admin}
            />
          </div>
          {admin ? (
            <Button type="submit" className="h-14 w-full text-base">
              Salvar configurações
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">
              Somente o administrador pode alterar estes valores.
            </p>
          )}
        </form>
      </section>
    </AppShell>
  );
}
