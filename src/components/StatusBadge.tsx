import { STATUS_CLASSE, STATUS_LABEL } from "@/lib/dominio";

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
        STATUS_CLASSE[status] ?? "bg-muted text-muted-foreground"
      }`}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}
