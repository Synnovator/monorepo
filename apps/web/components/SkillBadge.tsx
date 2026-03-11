import { Badge } from '@synnovator/ui';

export function SkillBadge({ label }: { label: string }) {
  return (
    <Badge variant="outline" className="hover:border-primary/40">
      {label}
    </Badge>
  );
}
