import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useSessao } from "@/hooks/useSessao";
import { registrarHistorico } from "@/lib/consultas";

export const Route = createFileRoute("/_authenticated/solicitacoes/nova")({
  head: () => ({
    meta: [
      { title: "Nova solicitação — Compras Manutenção" },
      { name: "description", content: "Registre uma nova necessidade de compra da Manutenção." },
      { property: "og:title", content: "Nova solicitação — Compras Manutenção" },
      {
        property: "og:description",
        content: "Registre uma nova necessidade de compra da Manutenção.",
      },
    ],
  }),
  component: Nova,
});

function Nova() {
  const { session } = useSessao();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [item, setItem] = useState("");
  const [quantidade, setQuantidade] = useState("1");
  const [unidade, setUnidade] = useState("un");
  const [motivo, setMotivo] = useState("");
  const [prazo, setPrazo] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;
    setEnviando(true);
    try {
      const { data, error } = await supabase
        .from("solicitacoes_compra")
        .insert({
          item,
          quantidade: Number(quantidade),
          unidade,
          motivo,
          prazo_desejado: prazo || null,
          solicitante_id: session.user.id,
        })
        .select("id")
        .single();
      if (error) throw error;
      await registrarHistorico(data.id, null, "solicitado", session.user.id, "Solicitação criada");
      await queryClient.invalidateQueries({ queryKey: ["solicitacoes"] });
      toast.success("Solicitação criada.");
      void navigate({ to: "/solicitacoes/$id", params: { id: data.id } });
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível salvar.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <AppShell titulo="Nova solicitação">
      <form className="space-y-5" onSubmit={salvar}>
        <div className="space-y-1.5">
          <Label htmlFor="item">O que precisa comprar?</Label>
          <Input
            id="item"
            className="h-12"
            value={item}
            onChange={(e) => setItem(e.target.value)}
            placeholder="Ex.: Tinta acrílica branca 18L"
            required
          />
        </div>
        <div className="flex gap-3">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="qtd">Quantidade</Label>
            <Input
              id="qtd"
              className="h-12"
              type="number"
              min="0.01"
              step="0.01"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              required
            />
          </div>
          <div className="w-28 space-y-1.5">
            <Label htmlFor="un">Unidade</Label>
            <Input
              id="un"
              className="h-12"
              value={unidade}
              onChange={(e) => setUnidade(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="motivo">Por que é necessário?</Label>
          <Textarea
            id="motivo"
            rows={4}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Ex.: Pintura da sala de aula do fundo, paredes descascando."
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="prazo">Prazo desejado</Label>
          <Input
            id="prazo"
            className="h-12"
            type="date"
            value={prazo}
            onChange={(e) => setPrazo(e.target.value)}
          />
        </div>
        <Button type="submit" className="h-14 w-full text-base" disabled={enviando}>
          {enviando ? "Salvando..." : "Enviar solicitação"}
        </Button>
      </form>
    </AppShell>
  );
}
