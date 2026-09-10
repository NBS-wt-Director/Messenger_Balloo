import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../../components/shared/Button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Нажми меня</Button>);
    expect(screen.getByText('Нажми меня')).toBeInTheDocument();
  });

  it('handles click', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);

    fireEvent.click(screen.getByText('Click'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop set', () => {
    const onClick = vi.fn();
    render(<Button disabled onClick={onClick}>Disabled</Button>);

    expect(screen.getByText('Disabled')).toBeDisabled();
    fireEvent.click(screen.getByText('Disabled'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('is disabled when loading', () => {
    render(<Button loading>Loading</Button>);
    expect(screen.getByText('Loading')).toBeDisabled();
  });

  it('renders all variants without crash', () => {
    for (const variant of ['primary', 'secondary', 'ghost', 'danger', 'tertiary'] as const) {
      const { unmount } = render(<Button variant={variant}>{variant}</Button>);
      expect(screen.getByText(variant)).toBeInTheDocument();
      unmount();
    }
  });

  it('renders all sizes without crash', () => {
    for (const size of ['sm', 'md', 'lg'] as const) {
      const { unmount } = render(<Button size={size}>{size}</Button>);
      expect(screen.getByText(size)).toBeInTheDocument();
      unmount();
    }
  });

  it('defaults to type=button', () => {
    render(<Button>Type</Button>);
    expect(screen.getByText('Type')).toHaveAttribute('type', 'button');
  });

  it('supports type=submit', () => {
    render(<Button type="submit">Submit</Button>);
    expect(screen.getByText('Submit')).toHaveAttribute('type', 'submit');
  });
});
