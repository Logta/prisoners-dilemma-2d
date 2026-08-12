import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  describe('variant styles', () => {
    it('applies primary variant classes by default', () => {
      render(<Button>Test</Button>);

      const button = screen.getByRole('button', { name: 'Test' });
      expect(button.className).toContain('bg-blue-600');
    });

    it('applies secondary variant classes when specified', () => {
      render(<Button variant="secondary">Test</Button>);

      const button = screen.getByRole('button', { name: 'Test' });
      expect(button.className).toContain('bg-gray-100');
      expect(button.className).not.toContain('bg-blue-600');
    });

    it('applies danger variant classes when specified', () => {
      render(<Button variant="danger">Test</Button>);

      const button = screen.getByRole('button', { name: 'Test' });
      expect(button.className).toContain('bg-red-600');
    });
  });

  describe('size styles', () => {
    it('applies medium size classes by default', () => {
      render(<Button>Test</Button>);

      const button = screen.getByRole('button', { name: 'Test' });
      expect(button.className).toContain('h-10');
    });

    it('applies small size classes when specified', () => {
      render(<Button size="sm">Test</Button>);

      const button = screen.getByRole('button', { name: 'Test' });
      expect(button.className).toContain('h-8');
    });

    it('applies large size classes when specified', () => {
      render(<Button size="lg">Test</Button>);

      const button = screen.getByRole('button', { name: 'Test' });
      expect(button.className).toContain('h-12');
    });
  });

  describe('disabled state', () => {
    it('disables the underlying button element when disabled is true', () => {
      render(<Button disabled={true}>Test</Button>);

      expect(screen.getByRole('button', { name: 'Test' })).toBeDisabled();
    });

    it('is not disabled by default', () => {
      render(<Button>Test</Button>);

      expect(screen.getByRole('button', { name: 'Test' })).not.toBeDisabled();
    });

    it('does not fire onClick when disabled', () => {
      const onClick = vi.fn();
      render(
        <Button disabled={true} onClick={onClick}>
          Test
        </Button>
      );

      fireEvent.click(screen.getByRole('button', { name: 'Test' }));

      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe('interaction', () => {
    it('fires onClick when clicked', () => {
      const onClick = vi.fn();
      render(<Button onClick={onClick}>Test</Button>);

      fireEvent.click(screen.getByRole('button', { name: 'Test' }));

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('merges a custom className with the variant/size classes', () => {
      render(<Button className="custom-class">Test</Button>);

      const button = screen.getByRole('button', { name: 'Test' });
      expect(button.className).toContain('custom-class');
      expect(button.className).toContain('bg-blue-600');
    });
  });
});
