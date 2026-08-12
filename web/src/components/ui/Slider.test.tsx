import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Slider } from './Slider';

describe('Slider', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders a range input with the given value/min/max', () => {
      render(<Slider max={100} min={0} onChange={mockOnChange} value={50} />);

      const input = screen.getByRole('slider') as HTMLInputElement;
      expect(input.type).toBe('range');
      expect(input.value).toBe('50');
      expect(input.min).toBe('0');
      expect(input.max).toBe('100');
    });

    it('defaults step to 1 when not provided', () => {
      render(<Slider max={100} min={0} onChange={mockOnChange} value={50} />);

      expect(screen.getByRole('slider')).toHaveAttribute('step', '1');
    });

    it('uses a custom step value when provided', () => {
      render(<Slider max={100} min={0} onChange={mockOnChange} step={5} value={50} />);

      expect(screen.getByRole('slider')).toHaveAttribute('step', '5');
    });
  });

  describe('label', () => {
    it('does not render a label by default', () => {
      render(<Slider max={100} min={0} onChange={mockOnChange} value={50} />);

      expect(screen.queryByText(/:/)).not.toBeInTheDocument();
    });

    it('renders the label together with the current value', () => {
      render(<Slider label="Speed" max={100} min={0} onChange={mockOnChange} value={50} />);

      expect(screen.getByText('Speed: 50')).toBeInTheDocument();
    });
  });

  describe('interaction', () => {
    it('calls onChange with the numeric value when the slider moves', () => {
      render(<Slider max={100} min={0} onChange={mockOnChange} value={50} />);

      fireEvent.change(screen.getByRole('slider'), { target: { value: '75' } });

      expect(mockOnChange).toHaveBeenCalledTimes(1);
      expect(mockOnChange).toHaveBeenCalledWith(75);
    });

    it('handles decimal values', () => {
      render(<Slider max={100} min={0} onChange={mockOnChange} step={0.1} value={50.5} />);

      fireEvent.change(screen.getByRole('slider'), { target: { value: '60.5' } });

      expect(mockOnChange).toHaveBeenCalledWith(60.5);
    });
  });

  describe('className prop', () => {
    it('applies a custom className to the wrapper', () => {
      const { container } = render(
        <Slider className="custom-class" max={100} min={0} onChange={mockOnChange} value={50} />
      );

      expect(container.firstElementChild?.className).toContain('custom-class');
    });
  });
});
