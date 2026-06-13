import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Button } from '../../../src/components/ui/Button';

describe('Button', () => {
  it('renders correctly with default variant', () => {
    render(<Button>Click me</Button>);
    const btn = screen.getByRole('button', { name: 'Click me' });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveClass('text-status-cyan');
  });

  it('renders destructive variant', () => {
    render(<Button variant="destructive">Delete</Button>);
    const btn = screen.getByRole('button', { name: 'Delete' });
    expect(btn).toHaveClass('text-status-red');
  });

  it('renders warning variant', () => {
    render(<Button variant="warning">Warn</Button>);
    const btn = screen.getByRole('button', { name: 'Warn' });
    expect(btn).toHaveClass('text-status-yellow');
  });

  it('renders success variant', () => {
    render(<Button variant="success">OK</Button>);
    const btn = screen.getByRole('button', { name: 'OK' });
    expect(btn).toHaveClass('text-status-green');
  });

  it('renders ghost variant', () => {
    render(<Button variant="ghost">Ghost</Button>);
    const btn = screen.getByRole('button', { name: 'Ghost' });
    expect(btn).toHaveClass('text-zinc-400');
  });
});
