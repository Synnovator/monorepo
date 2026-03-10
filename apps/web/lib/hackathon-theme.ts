import type React from 'react';
import { GlobeIcon, ShieldCheckIcon, RocketIcon } from '@/components/icons';

/**
 * Returns Tailwind classes that give each hackathon type a distinct card shape.
 *
 *  - community (default): rounded-xl with a coloured top border
 *  - enterprise:          rounded-sm with a coloured left border
 *  - youth-league:        rounded-lg, dashed border, slight rotation
 */
export function hackathonCardClass(type: string): string {
  switch (type) {
    case 'enterprise':
      return 'rounded-sm border-l-3 border-l-brand';
    case 'youth-league':
      return 'rounded-lg border-dashed -rotate-[0.3deg]';
    default: // community
      return 'rounded-xl border-t-3 border-t-brand';
  }
}

/**
 * Returns Tailwind hover transform classes per hackathon type.
 *
 *  - community:    gentle lift
 *  - enterprise:   precise scale
 *  - youth-league: snap-back to level from the resting -0.3deg tilt
 */
export function hackathonHoverClass(type: string): string {
  switch (type) {
    case 'enterprise':
      return 'hover:scale-[1.01]';
    case 'youth-league':
      return 'hover:rotate-0';
    default:
      return 'hover:-translate-y-0.5';
  }
}

/**
 * Returns the icon component that represents the hackathon type.
 */
export function hackathonTypeIcon(
  type: string,
): React.FC<{ size?: number; className?: string }> {
  switch (type) {
    case 'enterprise':
      return ShieldCheckIcon;
    case 'youth-league':
      return RocketIcon;
    default:
      return GlobeIcon;
  }
}
