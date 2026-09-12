import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { useSessao } from "@/hooks/useSessao";
import { listarSolicitacoes, type Solicitacao } from "@/lib/consultas";
import { dataCurta, ehResponsavel, moeda } from "@/lib/dominio";

export const Route = createFileRoute("/_authenticated/hoje")({
  head: () => ({
    meta: [
      { title: "Hoje — Compras Manutenção" },
      { name: "description", content: "Suas pendências de compras ordenadas por prazo." },
      { property: "og:title", content: "Hoje — Compras Manutenção" },
      { property: "og:description", content: "Suas pendências de compras ordenadas por prazo." },
    ],
  }),
  component: Hoje,
});

function prazoOrdem(s: Solicitacao) {
  return s.prazo_desejado ? new Date(`${s.prazo_desejado}T12:00:00`).getTime() : Infinity;
}

function Hoje() {
  const { session, papeis } = useSessao();
  const { data, isLoading } = useQuery({ queryKey: ["solicitacoes"], queryFn: listarSolicitacoes });

  const todas = data ?? [];
  const minhasAcoes = todas
    .filter((s) => ehResponsavel(s.status, papeis))
    .sort((a, b) => prazoOrdem(a) - prazoOrdem(b));
  const meusPedidos = todas
    .filter(
      (s) =>
        s.solicitante_id === session?.user.id &&
        !["concluido", "cancelado"].includes(s.status) &&
        !minhasAcoes.some((m) => m.id === s.id),
    )
    .sort((a, b) => prazoOrdem(a) - prazoOrdem(b));

  return (
    <AppShell titulo="Hoje">
      <Button asChild className="mb-5 h-14 w-full text-base">
        <Link to="/solicitacoes/nova">
          <Plus className="size-5" /> Nova solicitação
        </Link>
      </Button>

      <Secao titulo="Aguardando você" itens={minhasAcoes} carregando={isLoading} vazio="Nenhuma pendência para o seu papel agora." />
      <Secao titulo="Meus pedidos em andamento" itens={meusPedidos} carregando={isLoading} vazio="Você não tem pedidos em andamento." />
    </AppShell>
  );
}

function Secao({
  titulo,
  itens,
  carregando,
  vazio,
}: {
  titulo: string;
  itens: Solicitacao[];
  carregando: boolean;
  vazio: string;
}) {
  return (
    <section className="mb-6">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {titulo}
      </h2>
      {carregando ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : itens.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
          {vazio}
        </p>
      ) : (
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
                  {s.quantidade} {s.unidade} · prazo {dataCurta(s.prazo_desejado)} ·{" "}
                  {moeda(s.valor_final)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
