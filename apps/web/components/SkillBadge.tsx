export function SkillBadge({ label }: { label: string }) {
  return (
    <span className="inline-block text-xs px-2.5 py-1 rounded-full border border-border bg-card text-foreground hover:border-primary/40 transition-colors">
      {label}
    </span>
  );
}
