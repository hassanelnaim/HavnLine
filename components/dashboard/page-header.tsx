export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-[22px] font-semibold text-ink">{title}</h1>
        {description && <p className="mt-1 text-[13.5px] text-text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
