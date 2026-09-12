import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useSessao } from "@/hooks/useSessao";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Compras Manutenção — Igreja" },
      {
        name: "description",
        content:
          "Sistema de compras do setor de Manutenção: solicitações, cotações, aprovação, recebimento e nota fiscal.",
      },
      { property: "og:title", content: "Compras Manutenção — Igreja" },
      {
        property: "og:description",
        content:
          "Sistema de compras do setor de Manutenção: solicitações, cotações, aprovação, recebimento e nota fiscal.",
      },
    ],
  }),
  component: Inicio,
});

function Inicio() {
  const { session, carregando } = useSessao();
  const navigate = useNavigate();

  useEffect(() => {
    if (!carregando && session) void navigate({ to: "/hoje", replace: true });
  }, [carregando, session, navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Compras Manutenção</h1>
        <p className="mt-3 max-w-sm text-muted-foreground">
          Solicitações, cotações, aprovações, recebimento e nota fiscal em um só lugar.
        </p>
      </div>
      <Button size="lg" className="h-14 w-full max-w-xs text-base" asChild>
        <a href="/auth">Entrar</a>
      </Button>
    </div>
  );
}
