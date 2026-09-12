import { supabase } from "@/integrations/supabase/client";

export type Solicitacao = {
  id: string;
  item: string;
  quantidade: number;
  unidade: string;
  motivo: string | null;
  solicitante_id: string;
  status: string;
  valor_final: number | null;
  cotacao_escolhida_id: string | null;
  prazo_desejado: string | null;
  observacoes: string | null;
  created_at: string;
  aprovado_em: string | null;
  recebido_em: string | null;
  concluido_em: string | null;
};

export async function listarSolicitacoes() {
  const { data, error } = await supabase
    .from("solicitacoes_compra")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Solicitacao[];
}

export async function listarPerfis() {
  const { data, error } = await supabase.from("profiles").select("id, nome, setor");
  if (error) throw error;
  return (data ?? []) as { id: string; nome: string; setor: string }[];
}

export async function listarFornecedores() {
  const { data, error } = await supabase
    .from("fornecedores")
    .select("*")
    .order("nome", { ascending: true });
  if (error) throw error;
  return (data ?? []) as {
    id: string;
    nome: string;
    contato: string | null;
    whatsapp: string | null;
    categoria: string | null;
    observacoes: string | null;
  }[];
}

export async function obterConfiguracoes() {
  const { data, error } = await supabase.from("configuracoes").select("chave, valor, descricao");
  if (error) throw error;
  const mapa: Record<string, number> = {};
  for (const linha of data ?? []) mapa[linha.chave as string] = Number(linha.valor);
  return {
    limite: mapa["limite_aprovacao_automatica"] ?? 500,
    minimoCotacoes: mapa["minimo_cotacoes"] ?? 3,
  };
}

export async function registrarHistorico(
  solicitacaoId: string,
  statusAnterior: string | null,
  statusNovo: string,
  usuarioId: string,
  comentario?: string,
) {
  await supabase.from("historico_solicitacao").insert({
    solicitacao_id: solicitacaoId,
    status_anterior: statusAnterior as never,
    status_novo: statusNovo as never,
    usuario_id: usuarioId,
    comentario: comentario ?? null,
  });
}
