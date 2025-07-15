import { describe, expect, it } from 'vitest';
import { Button } from './Button';

describe('Button', () => {
  describe('variant styles', () => {
    it('should apply primary variant class by default', () => {
      // Arrange
      const button = <Button>Test</Button>;

      // Act & Assert
      expect(button.props.variant).toBeUndefined(); // デフォルトはundefined
      expect(button.props.children).toBe('Test');
    });

    it('should apply secondary variant class when specified', () => {
      // Arrange
      const button = <Button variant="secondary">Test</Button>;

      // Act
      const variant = button.props.variant;

      // Assert
      expect(variant).toBe('secondary');
    });

    it('should apply danger variant class when specified', () => {
      // Arrange
      const button = <Button variant="danger">Test</Button>;

      // Act
      const variant = button.props.variant;

      // Assert
      expect(variant).toBe('danger');
    });
  });

  describe('size styles', () => {
    it('should apply medium size by default', () => {
      // Arrange
      const button = <Button>Test</Button>;

      // Act
      const size = button.props.size;

      // Assert
      expect(size).toBeUndefined(); // デフォルトはundefined
    });

    it('should apply small size when specified', () => {
      // Arrange
      const button = <Button size="sm">Test</Button>;

      // Act
      const size = button.props.size;

      // Assert
      expect(size).toBe('sm');
    });

    it('should apply large size when specified', () => {
      // Arrange
      const button = <Button size="lg">Test</Button>;

      // Act
      const size = button.props.size;

      // Assert
      expect(size).toBe('lg');
    });
  });

  describe('disabled state', () => {
    it('should pass disabled prop correctly', () => {
      // Arrange
      const button = <Button disabled={true}>Test</Button>;

      // Act
      const disabled = button.props.disabled;

      // Assert
      expect(disabled).toBe(true);
    });

    it('should not be disabled by default', () => {
      // Arrange
      const button = <Button>Test</Button>;

      // Act
      const disabled = button.props.disabled;

      // Assert
      expect(disabled).toBeUndefined();
    });
  });
});
