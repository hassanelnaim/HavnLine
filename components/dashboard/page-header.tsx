export function PageHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-6">
      <h1 className="font-display text-[24px] font-semibold text-ink">{title}</h1>
      <p className="mt-1 text-[13.5px] text-text-muted">{description}</p>
    </div>
  );
}
