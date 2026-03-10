import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ModeToggle } from '@/components/ModeToggle';

// Mock next-themes
vi.mock('next-themes', () => ({
  useTheme: vi.fn(() => ({
    resolvedTheme: 'light',
    setTheme: vi.fn(),
  })),
}));

describe('ModeToggle', () => {
  it('renders without crashing', () => {
    render(<ModeToggle />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('has accessible label', () => {
    render(<ModeToggle />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label');
  });
});
