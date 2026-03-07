export function SkillBadge({ label }: { label: string }) {
  return (
    <span className="inline-block text-xs px-2.5 py-1 rounded-full border border-secondary-bg bg-dark-bg text-light-gray hover:border-lime-primary/40 transition-colors">
      {label}
    </span>
  );
}
