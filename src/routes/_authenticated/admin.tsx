import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { useSessao } from "@/hooks/useSessao";
import {
  listarHistoricoGeral,
  listarSolicitacoes,
  listarUsuariosComPapeis,
} from "@/lib/consultas";
import { PAPEL_LABEL, STATUS_LABEL, dataCurta, dataHora, moeda, type Papel } from "@/lib/dominio";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Administração — Compras Manutenção" },
      {
        name: "description",
        content: "Usuários, papéis e histórico de todas as solicitações de compra.",
      },
      { property: "og:title", content: "Administração — Compras Manutenção" },
      {
        property: "og:description",
        content: "Usuários, papéis e histórico de todas as solicitações de compra.",
      },
    ],
  }),
  component: Admin,
});

const PAPEIS: Papel[] = [
  "manutencao",
  "compras",
  "encarregado",
  "recebimento",
  "financeiro",
  "admin",
];

function Admin() {
  const { temPapel, session } = useSessao();
  const admin = temPapel("admin");
  const [aba, setAba] = useState<"usuarios" | "historico">("usuarios");

  if (!admin) {
    return (
      <AppShell titulo="Administração">
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <p className="font-medium text-foreground">Área restrita</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Somente administradores podem ver esta tela.
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell titulo="Administração">
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant={aba === "usuarios" ? "default" : "outline"}
          className="h-12"
          onClick={() => setAba("usuarios")}
        >
          Usuários
        </Button>
        <Button
          variant={aba === "historico" ? "default" : "outline"}
          className="h-12"
          onClick={() => setAba("historico")}
        >
          Histórico
        </Button>
      </div>

      <div className="mt-4">
        {aba === "usuarios" ? <Usuarios meuId={session?.user.id ?? ""} /> : <Historico />}
      </div>
    </AppShell>
  );
}

function Usuarios({ meuId }: { meuId: string }) {
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState("");
  const usuarios = useQuery({ queryKey: ["admin-usuarios"], queryFn: listarUsuariosComPapeis });
  const [salvando, setSalvando] = useState<string | null>(null);

  async function alternar(userId: string, papel: Papel, tem: boolean, papelId?: string) {
    setSalvando(`${userId}-${papel}`);
    const erro = tem
      ? (await supabase.from("user_roles").delete().eq("id", papelId!)).error
      : (await supabase.from("user_roles").insert({ user_id: userId, role: papel })).error;
    setSalvando(null);
    if (erro) {
      toast.error(erro.message);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["admin-usuarios"] });
    toast.success(tem ? "Papel removido." : "Papel adicionado.");
  }

  const lista = (usuarios.data ?? []).filter((u) =>
    `${u.nome} ${u.setor}`.toLowerCase().includes(busca.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      <Input
        className="h-12"
        placeholder="Buscar pessoa ou setor"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
      />

      {usuarios.isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : lista.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma pessoa encontrada.</p>
      ) : (
        lista.map((u) => (
          <section key={u.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">
                  {u.nome || "Sem nome"}
                  {u.id === meuId && (
                    <span className="ml-2 text-xs text-muted-foreground">(você)</span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {u.setor} · desde {dataCurta(u.created_at)}
                  {u.telefone ? ` · ${u.telefone}` : ""}
                </p>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {PAPEIS.map((papel) => {
                const atual = u.papeis.find((p) => p.role === papel);
                const tem = Boolean(atual);
                const chave = `${u.id}-${papel}`;
                return (
                  <button
                    key={papel}
                    type="button"
                    disabled={salvando === chave}
                    onClick={() => void alternar(u.id, papel, tem, atual?.id)}
                    className={`rounded-full border px-3 py-2 text-sm font-medium transition-colors ${
                      tem
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground"
                    } ${salvando === chave ? "opacity-60" : ""}`}
                  >
                    {PAPEL_LABEL[papel]}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Toque em um papel para conceder ou retirar o acesso.
            </p>
          </section>
        ))
      )}
    </div>
  );
}

function Historico() {
  const historico = useQuery({ queryKey: ["admin-historico"], queryFn: () => listarHistoricoGeral() });
  const solicitacoes = useQuery({ queryKey: ["solicitacoes"], queryFn: listarSolicitacoes });
  const usuarios = useQuery({ queryKey: ["admin-usuarios"], queryFn: listarUsuariosComPapeis });

  const nomePorId = new Map((usuarios.data ?? []).map((u) => [u.id, u.nome]));
  const solicPorId = new Map((solicitacoes.data ?? []).map((s) => [s.id, s]));

  if (historico.isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando…</p>;
  }

  if ((historico.data ?? []).length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma movimentação registrada ainda.</p>;
  }

  return (
    <div className="space-y-3">
      {(historico.data ?? []).map((h) => {
        const s = solicPorId.get(h.solicitacao_id);
        return (
          <Link
            key={h.id}
            to="/solicitacoes/$id"
            params={{ id: h.solicitacao_id }}
            className="block rounded-xl border border-border bg-card p-4"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="min-w-0 flex-1 truncate font-medium text-foreground">
                {s ? `${s.item} · ${s.quantidade} ${s.unidade}` : "Solicitação removida"}
              </p>
              <StatusBadge status={h.status_novo} />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {h.status_anterior ? `${STATUS_LABEL[h.status_anterior]} → ` : ""}
              {STATUS_LABEL[h.status_novo]} · {dataHora(h.created_at)} ·{" "}
              {nomePorId.get(h.usuario_id ?? "") ?? "Sistema"}
            </p>
            {s?.valor_final != null && (
              <p className="mt-1 text-xs text-muted-foreground">Valor: {moeda(s.valor_final)}</p>
            )}
            {h.comentario && <p className="mt-2 text-sm text-foreground">{h.comentario}</p>}
          </Link>
        );
      })}
    </div>
  );
}
