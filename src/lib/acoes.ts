import type { Papel } from "./dominio";

export type Acao = {
  id: string;
  label: string;
  novoStatus: string;
  destrutiva?: boolean;
  bloqueio?: string;
};

type Contexto = {
  status: string;
  valorFinal: number | null;
  limite: number;
  minimoCotacoes: number;
  qtdCotacoes: number;
  temNotaFiscal: boolean;
};

export function acoesDisponiveis(ctx: Contexto, papeis: Papel[]): Acao[] {
  const pode = (...alvo: Papel[]) =>
    alvo.some((p) => papeis.includes(p)) || papeis.includes("admin");

  switch (ctx.status) {
    case "solicitado":
      return pode("compras")
        ? [{ id: "iniciar", label: "Iniciar cotação", novoStatus: "em_cotacao" }]
        : [];
    case "em_cotacao": {
      if (!pode("compras")) return [];
      const faltamCotacoes = ctx.qtdCotacoes < ctx.minimoCotacoes;
      const semEscolha = ctx.valorFinal === null;
      const bloqueio = faltamCotacoes
        ? `Registre pelo menos ${ctx.minimoCotacoes} cotações.`
        : semEscolha
          ? "Escolha a cotação vencedora."
          : undefined;
      const dentroDoLimite = (ctx.valorFinal ?? 0) <= ctx.limite;
      return [
        {
          id: "avancar",
          label: dentroDoLimite
            ? "Aprovar automaticamente (dentro do limite)"
            : "Enviar para aprovação do encarregado",
          novoStatus: dentroDoLimite ? "aprovado" : "aguardando_aprovacao",
          ...(bloqueio ? { bloqueio } : {}),
        },
      ];
    }
    case "aguardando_aprovacao":
      return pode("encarregado")
        ? [
            { id: "aprovar", label: "Aprovar compra", novoStatus: "aprovado" },
            { id: "reprovar", label: "Reprovar", novoStatus: "cancelado", destrutiva: true },
          ]
        : [];
    case "aprovado":
      return pode("compras")
        ? [{ id: "comprar", label: "Marcar como comprado", novoStatus: "comprado" }]
        : [];
    case "comprado":
      return pode("recebimento")
        ? [
            {
              id: "receber",
              label: "Registrar recebimento na Central",
              novoStatus: "recebido",
              ...(ctx.temNotaFiscal ? {} : { bloqueio: "Anexe a foto da Nota Fiscal." }),
            },
          ]
        : [];
    case "recebido":
      return pode("financeiro")
        ? [{ id: "concluir", label: "NF repassada ao Financeiro — concluir", novoStatus: "concluido" }]
        : [];
    default:
      return [];
  }
}
