export function ProductStatusBadge({ status }: { status: "DRAFT" | "PUBLISHED" | "ARCHIVED" }) {
  const styles = {
    DRAFT: "bg-amber-100 text-amber-800 border-amber-200",
    PUBLISHED: "bg-green-100 text-green-800 border-green-200",
    ARCHIVED: "bg-muted text-muted-foreground border-muted/50",
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider border ${styles[status]}`}>
      {status}
    </span>
  );
}
