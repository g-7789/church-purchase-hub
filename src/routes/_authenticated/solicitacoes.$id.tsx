import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, Camera } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { StatusBadge } from "@/components/StatusBadge";
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
import { supabase } from "@/integrations/supabase/client";
import { useSessao } from "@/hooks/useSessao";
import {
  listarFornecedores,
  listarPerfis,
  obterConfiguracoes,
  registrarHistorico,
  type Solicitacao,
} from "@/lib/consultas";
import { STATUS_LABEL, dataCurta, dataHora, moeda } from "@/lib/dominio";
import { acoesDisponiveis } from "@/lib/acoes";

export const Route = createFileRoute("/_authenticated/solicitacoes/$id")({
  head: () => ({
    meta: [
      { title: "Solicitação — Compras Manutenção" },
      { name: "description", content: "Detalhes, cotações, anexos e histórico da solicitação." },
      { property: "og:title", content: "Solicitação — Compras Manutenção" },
      {
        property: "og:description",
        content: "Detalhes, cotações, anexos e histórico da solicitação.",
      },
    ],
  }),
  component: Detalhe,
});

type Cotacao = {
  id: string;
  fornecedor_id: string | null;
  valor: number;
  prazo_entrega_dias: number | null;
  observacoes: string | null;
  created_at: string;
};

type Anexo = {
  id: string;
  tipo: string;
  caminho: string;
  descricao: string | null;
  created_at: string;
};

function Detalhe() {
  const { id } = Route.useParams();
  const { session, papeis, temPapel } = useSessao();
  const queryClient = useQueryClient();

  const solicitacao = useQuery({
    queryKey: ["solicitacao", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("solicitacoes_compra")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as Solicitacao | null;
    },
  });

  const cotacoes = useQuery({
    queryKey: ["cotacoes", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cotacoes")
        .select("*")
        .eq("solicitacao_id", id)
        .order("valor", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Cotacao[];
    },
  });

  const anexos = useQuery({
    queryKey: ["anexos", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("anexos")
        .select("*")
        .eq("solicitacao_id", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const lista = (data ?? []) as Anexo[];
      const comUrl = await Promise.all(
        lista.map(async (a) => {
          const { data: url } = await supabase.storage
            .from("anexos")
            .createSignedUrl(a.caminho, 3600);
          return { ...a, url: url?.signedUrl ?? null };
        }),
      );
      return comUrl;
    },
  });

  const historico = useQuery({
    queryKey: ["historico", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("historico_solicitacao")
        .select("*")
        .eq("solicitacao_id", id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as {
        id: string;
        status_anterior: string | null;
        status_novo: string;
        usuario_id: string | null;
        comentario: string | null;
        created_at: string;
      }[];
    },
  });

  const perfis = useQuery({ queryKey: ["perfis"], queryFn: listarPerfis });
  const fornecedores = useQuery({ queryKey: ["fornecedores"], queryFn: listarFornecedores });
  const config = useQuery({ queryKey: ["configuracoes"], queryFn: obterConfiguracoes });

  const [novoFornecedor, setNovoFornecedor] = useState("");
  const [novoValor, setNovoValor] = useState("");
  const [novoPrazo, setNovoPrazo] = useState("");
  const [enviandoFoto, setEnviandoFoto] = useState(false);

  const s = solicitacao.data;
  const podeCotar = temPapel("compras", "admin");
  const nomePor = (uid: string | null) =>
    perfis.data?.find((p) => p.id === uid)?.nome ?? "Usuário";
  const nomeFornecedor = (fid: string | null) =>
    fornecedores.data?.find((f) => f.id === fid)?.nome ?? "Fornecedor";

  const mudarStatus = useMutation({
    mutationFn: async ({ novoStatus }: { novoStatus: string }) => {
      if (!s || !session) return;
      const extras: Record<string, string> = {};
      if (novoStatus === "aprovado") {
        extras["aprovado_por"] = session.user.id;
        extras["aprovado_em"] = new Date().toISOString();
      }
      if (novoStatus === "recebido") {
        extras["recebido_por"] = session.user.id;
        extras["recebido_em"] = new Date().toISOString();
      }
      if (novoStatus === "concluido") extras["concluido_em"] = new Date().toISOString();

      const { error } = await supabase
        .from("solicitacoes_compra")
        .update({ status: novoStatus as never, ...extras })
        .eq("id", id);
      if (error) throw error;
      await registrarHistorico(id, s.status, novoStatus, session.user.id);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["solicitacao", id] });
      await queryClient.invalidateQueries({ queryKey: ["historico", id] });
      await queryClient.invalidateQueries({ queryKey: ["solicitacoes"] });
      toast.success("Status atualizado.");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro ao atualizar."),
  });

  async function adicionarCotacao(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;
    const { error } = await supabase.from("cotacoes").insert({
      solicitacao_id: id,
      fornecedor_id: novoFornecedor || null,
      valor: Number(novoValor),
      prazo_entrega_dias: novoPrazo ? Number(novoPrazo) : null,
      registrado_por: session.user.id,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    setNovoValor("");
    setNovoPrazo("");
    await queryClient.invalidateQueries({ queryKey: ["cotacoes", id] });
    toast.success("Cotação registrada.");
  }

  async function escolherCotacao(c: Cotacao) {
    const { error } = await supabase
      .from("solicitacoes_compra")
      .update({ cotacao_escolhida_id: c.id, valor_final: c.valor })
      .eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["solicitacao", id] });
    toast.success("Cotação escolhida.");
  }

  async function enviarFoto(arquivo: File, tipo: "nota_fiscal" | "cotacao") {
    if (!session) return;
    setEnviandoFoto(true);
    try {
      const caminho = `${id}/${Date.now()}-${arquivo.name.replace(/[^\w.-]/g, "_")}`;
      const { error: erroUpload } = await supabase.storage
        .from("anexos")
        .upload(caminho, arquivo, { upsert: false });
      if (erroUpload) throw erroUpload;
      const { error } = await supabase.from("anexos").insert({
        solicitacao_id: id,
        tipo,
        caminho,
        enviado_por: session.user.id,
      });
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["anexos", id] });
      toast.success("Foto anexada.");
    } catch (erro) {
      toast.error(erro instanceof Error ? erro.message : "Não foi possível anexar.");
    } finally {
      setEnviandoFoto(false);
    }
  }

  if (solicitacao.isLoading) {
    return (
      <AppShell titulo="Solicitação">
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </AppShell>
    );
  }
  if (!s) {
    return (
      <AppShell titulo="Solicitação">
        <p className="text-sm text-muted-foreground">Solicitação não encontrada.</p>
      </AppShell>
    );
  }

  const temNF = (anexos.data ?? []).some((a) => a.tipo === "nota_fiscal");
  const acoes = acoesDisponiveis(
    {
      status: s.status,
      valorFinal: s.valor_final === null ? null : Number(s.valor_final),
      limite: config.data?.limite ?? 500,
      minimoCotacoes: config.data?.minimoCotacoes ?? 3,
      qtdCotacoes: cotacoes.data?.length ?? 0,
      temNotaFiscal: temNF,
    },
    papeis,
  );

  return (
    <AppShell titulo={s.item}>
      <Button asChild variant="ghost" className="mb-3 -ml-2 h-10">
        <Link to="/solicitacoes">
          <ArrowLeft className="size-4" /> Voltar
        </Link>
      </Button>

      <section className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-card-foreground">
              {s.quantidade} {s.unidade} · {s.item}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Solicitado por {nomePor(s.solicitante_id)} em {dataCurta(s.created_at)}
            </p>
          </div>
          <StatusBadge status={s.status} />
        </div>
        {s.motivo && <p className="mt-3 text-sm text-foreground">{s.motivo}</p>}
        <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <div>
            <dt className="text-muted-foreground">Prazo desejado</dt>
            <dd className="font-medium">{dataCurta(s.prazo_desejado)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Valor final</dt>
            <dd className="font-medium">{moeda(s.valor_final ? Number(s.valor_final) : null)}</dd>
          </div>
        </dl>
      </section>

      {acoes.length > 0 && (
        <section className="mt-4 space-y-3">
          {acoes.map((a) => (
            <div key={a.id}>
              <Button
                className="h-14 w-full text-base"
                variant={a.destrutiva ? "destructive" : "default"}
                disabled={!!a.bloqueio || mudarStatus.isPending}
                onClick={() => mudarStatus.mutate({ novoStatus: a.novoStatus })}
              >
                {a.label}
              </Button>
              {a.bloqueio && (
                <p className="mt-1 text-center text-xs text-muted-foreground">{a.bloqueio}</p>
              )}
            </div>
          ))}
        </section>
      )}

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Cotações ({cotacoes.data?.length ?? 0} de {config.data?.minimoCotacoes ?? 3})
        </h2>
        <ul className="space-y-2">
          {(cotacoes.data ?? []).map((c) => (
            <li
              key={c.id}
              className={`rounded-xl border p-3 ${
                s.cotacao_escolhida_id === c.id
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-medium">{nomeFornecedor(c.fornecedor_id)}</p>
                  <p className="text-sm text-muted-foreground">
                    {moeda(Number(c.valor))}
                    {c.prazo_entrega_dias ? ` · entrega em ${c.prazo_entrega_dias} dias` : ""}
                  </p>
                </div>
                {podeCotar && s.status === "em_cotacao" && (
                  <Button
                    variant={s.cotacao_escolhida_id === c.id ? "secondary" : "outline"}
                    className="h-10"
                    onClick={() => void escolherCotacao(c)}
                  >
                    {s.cotacao_escolhida_id === c.id ? "Escolhida" : "Escolher"}
                  </Button>
                )}
              </div>
            </li>
          ))}
          {(cotacoes.data ?? []).length === 0 && (
            <li className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
              Nenhuma cotação registrada.
            </li>
          )}
        </ul>

        {podeCotar && ["solicitado", "em_cotacao"].includes(s.status) && (
          <form
            className="mt-3 space-y-3 rounded-xl border border-border bg-card p-4"
            onSubmit={adicionarCotacao}
          >
            <p className="text-sm font-medium">Registrar cotação</p>
            <div className="space-y-1.5">
              <Label>Fornecedor</Label>
              <Select value={novoFornecedor} onValueChange={setNovoFornecedor}>
                <SelectTrigger className="h-12 w-full">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {(fornecedores.data ?? []).map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3">
              <div className="flex-1 space-y-1.5">
                <Label htmlFor="valor">Valor (R$)</Label>
                <Input
                  id="valor"
                  className="h-12"
                  type="number"
                  step="0.01"
                  min="0"
                  value={novoValor}
                  onChange={(e) => setNovoValor(e.target.value)}
                  required
                />
              </div>
              <div className="w-32 space-y-1.5">
                <Label htmlFor="prazoDias">Prazo (dias)</Label>
                <Input
                  id="prazoDias"
                  className="h-12"
                  type="number"
                  min="0"
                  value={novoPrazo}
                  onChange={(e) => setNovoPrazo(e.target.value)}
                />
              </div>
            </div>
            <Button type="submit" className="h-12 w-full">
              Adicionar cotação
            </Button>
          </form>
        )}
      </section>

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Anexos
        </h2>
        <div className="flex flex-col gap-2 sm:flex-row">
          <BotaoFoto
            rotulo="Anexar foto da Nota Fiscal"
            desabilitado={enviandoFoto}
            aoEscolher={(f) => void enviarFoto(f, "nota_fiscal")}
          />
          <BotaoFoto
            rotulo="Anexar foto de cotação"
            desabilitado={enviandoFoto}
            aoEscolher={(f) => void enviarFoto(f, "cotacao")}
          />
        </div>
        <ul className="mt-3 grid grid-cols-2 gap-3">
          {(anexos.data ?? []).map((a) => (
            <li key={a.id} className="overflow-hidden rounded-xl border border-border bg-card">
              {a.url && (
                <a href={a.url} target="_blank" rel="noreferrer">
                  <img
                    src={a.url}
                    alt={a.tipo === "nota_fiscal" ? "Foto da nota fiscal" : "Foto da cotação"}
                    className="h-32 w-full object-cover"
                    loading="lazy"
                  />
                </a>
              )}
              <p className="px-2 py-1.5 text-xs text-muted-foreground">
                {a.tipo === "nota_fiscal" ? "Nota fiscal" : "Cotação"} · {dataCurta(a.created_at)}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Histórico
        </h2>
        <ul className="space-y-2">
          {(historico.data ?? []).map((h) => (
            <li key={h.id} className="rounded-lg border border-border bg-card p-3 text-sm">
              <p className="font-medium">
                {h.status_anterior ? `${STATUS_LABEL[h.status_anterior]} → ` : ""}
                {STATUS_LABEL[h.status_novo]}
              </p>
              <p className="text-xs text-muted-foreground">
                {nomePor(h.usuario_id)} · {dataHora(h.created_at)}
                {h.comentario ? ` · ${h.comentario}` : ""}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </AppShell>
  );
}

function BotaoFoto({
  rotulo,
  desabilitado,
  aoEscolher,
}: {
  rotulo: string;
  desabilitado: boolean;
  aoEscolher: (arquivo: File) => void;
}) {
  return (
    <label className="flex h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium text-foreground active:bg-accent">
      <Camera className="size-5" />
      {desabilitado ? "Enviando..." : rotulo}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        disabled={desabilitado}
        onChange={(e) => {
          const arquivo = e.target.files?.[0];
          if (arquivo) aoEscolher(arquivo);
          e.target.value = "";
        }}
      />
    </label>
  );
}
