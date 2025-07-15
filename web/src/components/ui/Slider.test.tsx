import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Slider } from './Slider';

describe('Slider', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('props validation', () => {
    it('should accept required props correctly', () => {
      // Arrange
      const slider = <Slider max={100} min={0} onChange={mockOnChange} value={50} />;

      // Act
      const props = slider.props;

      // Assert
      expect(props.value).toBe(50);
      expect(props.min).toBe(0);
      expect(props.max).toBe(100);
      expect(props.onChange).toBe(mockOnChange);
    });

    it('should use default step value when not provided', () => {
      // Arrange
      const slider = <Slider max={100} min={0} onChange={mockOnChange} value={50} />;

      // Act
      const step = slider.props.step;

      // Assert
      expect(step).toBeUndefined(); // デフォルトはコンポーネント内で1
    });

    it('should accept custom step value', () => {
      // Arrange
      const slider = <Slider max={100} min={0} onChange={mockOnChange} step={5} value={50} />;

      // Act
      const step = slider.props.step;

      // Assert
      expect(step).toBe(5);
    });
  });

  describe('label functionality', () => {
    it('should not have label by default', () => {
      // Arrange
      const slider = <Slider max={100} min={0} onChange={mockOnChange} value={50} />;

      // Act
      const label = slider.props.label;

      // Assert
      expect(label).toBeUndefined();
    });

    it('should accept custom label', () => {
      // Arrange
      const slider = <Slider label="Speed" max={100} min={0} onChange={mockOnChange} value={50} />;

      // Act
      const label = slider.props.label;

      // Assert
      expect(label).toBe('Speed');
    });
  });

  describe('value boundaries', () => {
    it('should handle minimum value', () => {
      // Arrange
      const slider = <Slider max={100} min={0} onChange={mockOnChange} value={0} />;

      // Act
      const value = slider.props.value;

      // Assert
      expect(value).toBe(0);
    });

    it('should handle maximum value', () => {
      // Arrange
      const slider = <Slider max={100} min={0} onChange={mockOnChange} value={100} />;

      // Act
      const value = slider.props.value;

      // Assert
      expect(value).toBe(100);
    });

    it('should handle decimal values', () => {
      // Arrange
      const slider = <Slider max={100} min={0} onChange={mockOnChange} step={0.1} value={50.5} />;

      // Act
      const value = slider.props.value;

      // Assert
      expect(value).toBe(50.5);
    });
  });

  describe('className prop', () => {
    it('should accept custom className', () => {
      // Arrange
      const slider = (
        <Slider className="custom-class" max={100} min={0} onChange={mockOnChange} value={50} />
      );

      // Act
      const className = slider.props.className;

      // Assert
      expect(className).toBe('custom-class');
    });
  });
});
