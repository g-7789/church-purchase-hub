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

export async function listarUsuariosComPapeis() {
  const [{ data: perfis, error: e1 }, { data: papeis, error: e2 }] = await Promise.all([
    supabase.from("profiles").select("id, nome, setor, telefone, created_at").order("nome"),
    supabase.from("user_roles").select("id, user_id, role"),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;
  const porUsuario = new Map<string, { id: string; role: string }[]>();
  for (const linha of (papeis ?? []) as { id: string; user_id: string; role: string }[]) {
    const lista = porUsuario.get(linha.user_id) ?? [];
    lista.push({ id: linha.id, role: linha.role });
    porUsuario.set(linha.user_id, lista);
  }
  return ((perfis ?? []) as {
    id: string;
    nome: string;
    setor: string;
    telefone: string | null;
    created_at: string;
  }[]).map((p) => ({ ...p, papeis: porUsuario.get(p.id) ?? [] }));
}

export type LinhaHistorico = {
  id: string;
  solicitacao_id: string;
  status_anterior: string | null;
  status_novo: string;
  usuario_id: string | null;
  comentario: string | null;
  created_at: string;
};

export async function listarHistoricoGeral(limite = 200) {
  const { data, error } = await supabase
    .from("historico_solicitacao")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limite);
  if (error) throw error;
  return (data ?? []) as LinhaHistorico[];
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
