import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useSessao } from "@/hooks/useSessao";
import { listarFornecedores } from "@/lib/consultas";
import { dataCurta, moeda } from "@/lib/dominio";

export const Route = createFileRoute("/_authenticated/fornecedores")({
  head: () => ({
    meta: [
      { title: "Fornecedores — Compras Manutenção" },
      { name: "description", content: "Cadastro e histórico de cotações dos fornecedores." },
      { property: "og:title", content: "Fornecedores — Compras Manutenção" },
      {
        property: "og:description",
        content: "Cadastro e histórico de cotações dos fornecedores.",
      },
    ],
  }),
  component: Fornecedores,
});

function Fornecedores() {
  const { temPapel } = useSessao();
  const queryClient = useQueryClient();
  const podeEditar = temPapel("compras", "admin");
  const [busca, setBusca] = useState("");
  const [aberto, setAberto] = useState(false);
  const [form, setForm] = useState({
    nome: "",
    contato: "",
    whatsapp: "",
    categoria: "",
    observacoes: "",
  });
  const [expandido, setExpandido] = useState<string | null>(null);

  const fornecedores = useQuery({ queryKey: ["fornecedores"], queryFn: listarFornecedores });

  const cotacoes = useQuery({
    queryKey: ["cotacoes-fornecedor", expandido],
    enabled: !!expandido,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cotacoes")
        .select("id, valor, prazo_entrega_dias, created_at, solicitacao_id")
        .eq("fornecedor_id", expandido!)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("fornecedores").insert(form);
    if (error) {
      toast.error(error.message);
      return;
    }
    setForm({ nome: "", contato: "", whatsapp: "", categoria: "", observacoes: "" });
    setAberto(false);
    await queryClient.invalidateQueries({ queryKey: ["fornecedores"] });
    toast.success("Fornecedor cadastrado.");
  }

  const lista = (fornecedores.data ?? []).filter((f) =>
    `${f.nome} ${f.categoria ?? ""}`.toLowerCase().includes(busca.toLowerCase()),
  );

  return (
    <AppShell titulo="Fornecedores">
      <Input
        className="mb-4 h-12"
        placeholder="Buscar por nome ou categoria..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
      />

      {podeEditar && (
        <Button className="mb-4 h-12 w-full" onClick={() => setAberto((v) => !v)}>
          {aberto ? "Cancelar" : "Cadastrar fornecedor"}
        </Button>
      )}

      {podeEditar && aberto && (
        <form className="mb-6 space-y-3 rounded-xl border border-border bg-card p-4" onSubmit={salvar}>
          <div className="space-y-1.5">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              className="h-12"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="whats">WhatsApp / telefone</Label>
            <Input
              id="whats"
              className="h-12"
              value={form.whatsapp}
              onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cat">Categoria</Label>
            <Input
              id="cat"
              className="h-12"
              placeholder="Ex.: Elétrica, Hidráulica, Material de construção"
              value={form.categoria}
              onChange={(e) => setForm({ ...form, categoria: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="obs">Observações</Label>
            <Textarea
              id="obs"
              rows={3}
              placeholder="Confiabilidade, prazos, histórico de atendimento..."
              value={form.observacoes}
              onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
            />
          </div>
          <Button type="submit" className="h-12 w-full">
            Salvar fornecedor
          </Button>
        </form>
      )}

      <ul className="space-y-3">
        {lista.map((f) => (
          <li key={f.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-card-foreground">{f.nome}</p>
                <p className="text-sm text-muted-foreground">
                  {f.categoria || "Sem categoria"}
                  {f.whatsapp ? ` · ${f.whatsapp}` : ""}
                </p>
              </div>
              {f.whatsapp && (
                <Button asChild variant="outline" className="h-10">
                  <a
                    href={`https://wa.me/55${f.whatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    WhatsApp
                  </a>
                </Button>
              )}
            </div>
            {f.observacoes && <p className="mt-2 text-sm text-foreground">{f.observacoes}</p>}
            <Button
              variant="ghost"
              className="mt-2 h-10 px-0"
              onClick={() => setExpandido(expandido === f.id ? null : f.id)}
            >
              {expandido === f.id ? "Ocultar cotações" : "Ver cotações anteriores"}
            </Button>
            {expandido === f.id && (
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                {cotacoes.isLoading && <li>Carregando...</li>}
                {(cotacoes.data ?? []).map((c) => (
                  <li key={c.id}>
                    {dataCurta(c.created_at)} · {moeda(Number(c.valor))}
                    {c.prazo_entrega_dias ? ` · ${c.prazo_entrega_dias} dias` : ""}
                  </li>
                ))}
                {!cotacoes.isLoading && (cotacoes.data ?? []).length === 0 && (
                  <li>Nenhuma cotação registrada ainda.</li>
                )}
              </ul>
            )}
          </li>
        ))}
        {lista.length === 0 && (
          <li className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
            Nenhum fornecedor encontrado.
          </li>
        )}
      </ul>
    </AppShell>
  );
}
