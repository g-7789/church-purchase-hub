import { Link, useRouterState } from "@tanstack/react-router";
import { CalendarCheck, ClipboardList, Store, Settings, LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { useSessao } from "@/hooks/useSessao";
import { PAPEL_LABEL } from "@/lib/dominio";
import { Button } from "@/components/ui/button";

const itens = [
  { to: "/hoje", label: "Hoje", icone: CalendarCheck },
  { to: "/solicitacoes", label: "Compras", icone: ClipboardList },
  { to: "/fornecedores", label: "Fornec.", icone: Store },
  { to: "/configuracoes", label: "Ajustes", icone: Settings },
] as const;

export function AppShell({ titulo, children }: { titulo: string; children: ReactNode }) {
  const { perfil, papeis, sair } = useSessao();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-10 border-b border-border bg-card px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold text-foreground">{titulo}</h1>
            <p className="truncate text-xs text-muted-foreground">
              {perfil?.nome ?? "Usuário"}
              {papeis.length > 0 && ` · ${papeis.map((p) => PAPEL_LABEL[p]).join(", ")}`}
            </p>
          </div>
          <Button variant="ghost" size="icon" aria-label="Sair" onClick={() => void sair()}>
            <LogOut className="size-5" />
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-4">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-card">
        <div className="mx-auto grid max-w-3xl grid-cols-4">
          {itens.map(({ to, label, icone: Icone }) => {
            const ativo = pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex flex-col items-center gap-1 py-3 text-xs font-medium ${
                  ativo ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icone className="size-6" />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
