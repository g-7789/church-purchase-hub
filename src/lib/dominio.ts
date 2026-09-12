export const STATUS_ORDEM = [
  "solicitado",
  "em_cotacao",
  "aguardando_aprovacao",
  "aprovado",
  "comprado",
  "recebido",
  "concluido",
] as const;

export type Status = (typeof STATUS_ORDEM)[number] | "cancelado";

export const STATUS_LABEL: Record<string, string> = {
  solicitado: "Solicitado",
  em_cotacao: "Em cotação",
  aguardando_aprovacao: "Aguardando aprovação",
  aprovado: "Aprovado",
  comprado: "Comprado",
  recebido: "Recebido (com NF)",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

export const STATUS_CLASSE: Record<string, string> = {
  solicitado: "bg-muted text-muted-foreground",
  em_cotacao: "bg-accent text-accent-foreground",
  aguardando_aprovacao: "bg-warning text-warning-foreground",
  aprovado: "bg-primary text-primary-foreground",
  comprado: "bg-primary/80 text-primary-foreground",
  recebido: "bg-success text-success-foreground",
  concluido: "bg-success/70 text-success-foreground",
  cancelado: "bg-destructive text-destructive-foreground",
};

export type Papel =
  | "manutencao"
  | "compras"
  | "encarregado"
  | "recebimento"
  | "financeiro"
  | "admin";

export const PAPEL_LABEL: Record<Papel, string> = {
  manutencao: "Manutenção",
  compras: "Compras",
  encarregado: "Encarregado",
  recebimento: "Recebimento",
  financeiro: "Financeiro",
  admin: "Administrador",
};

export function moeda(valor?: number | null) {
  if (valor === null || valor === undefined) return "—";
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function dataCurta(valor?: string | null) {
  if (!valor) return "—";
  const d = new Date(valor.length <= 10 ? `${valor}T12:00:00` : valor);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

export function dataHora(valor?: string | null) {
  if (!valor) return "—";
  return new Date(valor).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Papel responsável por agir em cada etapa do fluxo. */
export const RESPONSAVEL_POR_STATUS: Record<string, Papel[]> = {
  solicitado: ["compras"],
  em_cotacao: ["compras"],
  aguardando_aprovacao: ["encarregado"],
  aprovado: ["compras"],
  comprado: ["recebimento"],
  recebido: ["financeiro"],
  concluido: [],
  cancelado: [],
};

export function ehResponsavel(status: string, papeis: Papel[]) {
  const alvo = RESPONSAVEL_POR_STATUS[status] ?? [];
  return alvo.some((p) => papeis.includes(p)) || (alvo.length > 0 && papeis.includes("admin"));
}
