import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listarPerfis, listarSolicitacoes } from "@/lib/consultas";
import { STATUS_LABEL, STATUS_ORDEM, dataCurta, moeda } from "@/lib/dominio";
import { useSessao } from "@/hooks/useSessao";

export const Route = createFileRoute("/_authenticated/solicitacoes/")({
  head: () => ({
    meta: [
      { title: "Solicitações — Compras Manutenção" },
      { name: "description", content: "Acompanhe todas as solicitações de compra por etapa." },
      { property: "og:title", content: "Solicitações — Compras Manutenção" },
      {
        property: "og:description",
        content: "Acompanhe todas as solicitações de compra por etapa.",
      },
    ],
  }),
  component: Lista,
});

function Lista() {
  const { session } = useSessao();
  const { data: solicitacoes, isLoading } = useQuery({
    queryKey: ["solicitacoes"],
    queryFn: listarSolicitacoes,
  });
  const { data: perfis } = useQuery({ queryKey: ["perfis"], queryFn: listarPerfis });
  const [busca, setBusca] = useState("");
  const [apenasMinhas, setApenasMinhas] = useState(false);

  const nomePor = (id: string) => perfis?.find((p) => p.id === id)?.nome ?? "—";
  const filtradas = (solicitacoes ?? []).filter(
    (s) =>
      s.item.toLowerCase().includes(busca.toLowerCase()) &&
      (!apenasMinhas || s.solicitante_id === session?.user.id),
  );

  return (
    <AppShell titulo="Solicitações">
      <div className="mb-4 flex gap-2">
        <Input
          className="h-12"
          placeholder="Buscar item..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <Button asChild size="icon" className="size-12 shrink-0" aria-label="Nova solicitação">
          <Link to="/solicitacoes/nova">
            <Plus className="size-5" />
          </Link>
        </Button>
      </div>

      <div className="mb-5 flex gap-2">
        <Button
          variant={apenasMinhas ? "default" : "outline"}
          className="h-10"
          onClick={() => setApenasMinhas((v) => !v)}
        >
          Somente minhas
        </Button>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}

      <div className="space-y-6">
        {STATUS_ORDEM.map((status) => {
          const itens = filtradas.filter((s) => s.status === status);
          if (itens.length === 0) return null;
          return (
            <section key={status}>
              <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {STATUS_LABEL[status]}
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{itens.length}</span>
              </h2>
              <ul className="space-y-3">
                {itens.map((s) => (
                  <li key={s.id}>
                    <Link
                      to="/solicitacoes/$id"
                      params={{ id: s.id }}
                      className="block rounded-xl border border-border bg-card p-4 shadow-sm active:bg-accent"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="font-medium text-card-foreground">{s.item}</span>
                        <StatusBadge status={s.status} />
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {s.quantidade} {s.unidade} · {nomePor(s.solicitante_id)} · prazo{" "}
                        {dataCurta(s.prazo_desejado)} · {moeda(s.valor_final)}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
        {!isLoading && filtradas.length === 0 && (
          <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
            Nenhuma solicitação encontrada.
          </p>
        )}
      </div>
    </AppShell>
  );
}
