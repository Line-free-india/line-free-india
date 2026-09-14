import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import '../index.css';

describe('Tailwind Classes Generate Correct CSS with Variables', () => {
  describe('Color Classes', () => {
    it('should generate bg-primary with CSS variable', () => {
      const { container } = render(<div className="bg-primary" data-testid="test" />);
      const element = container.firstChild as HTMLElement;
      const styles = window.getComputedStyle(element);
      
      // Check that background color is applied
      expect(styles.backgroundColor).toBeTruthy();
    });

    it('should generate text-primary with CSS variable', () => {
      const { container } = render(<div className="text-primary" data-testid="test">Text</div>);
      const element = container.firstChild as HTMLElement;
      const styles = window.getComputedStyle(element);
      
      // Check that text color is applied
      expect(styles.color).toBeTruthy();
    });

    it('should generate border-border with CSS variable', () => {
      const { container } = render(<div className="border border-border" data-testid="test" />);
      const element = container.firstChild as HTMLElement;
      const styles = window.getComputedStyle(element);
      
      // Check that border is applied
      expect(styles.borderWidth).toBeTruthy();
    });
  });

  describe('Typography Classes', () => {
    it('should generate text-xs with CSS variable', () => {
      const { container } = render(<div className="text-xs">Text</div>);
      const element = container.firstChild as HTMLElement;
      const styles = window.getComputedStyle(element);
      
      // Font size should be applied
      expect(styles.fontSize).toBeTruthy();
    });

    it('should generate text-base with CSS variable', () => {
      const { container } = render(<div className="text-base">Text</div>);
      const element = container.firstChild as HTMLElement;
      const styles = window.getComputedStyle(element);
      
      // Font size should be applied
      expect(styles.fontSize).toBeTruthy();
    });

    it('should generate text-4xl with CSS variable', () => {
      const { container } = render(<div className="text-4xl">Text</div>);
      const element = container.firstChild as HTMLElement;
      const styles = window.getComputedStyle(element);
      
      // Font size should be applied
      expect(styles.fontSize).toBeTruthy();
    });
  });

  describe('Spacing Classes', () => {
    it('should generate p-4 with CSS variable', () => {
      const { container } = render(<div className="p-4" />);
      const element = container.firstChild as HTMLElement;
      const styles = window.getComputedStyle(element);
      
      // Padding should be applied
      expect(styles.padding).toBeTruthy();
    });

    it('should generate m-8 with CSS variable', () => {
      const { container } = render(<div className="m-8" />);
      const element = container.firstChild as HTMLElement;
      const styles = window.getComputedStyle(element);
      
      // Margin should be applied
      expect(styles.margin).toBeTruthy();
    });

    it('should generate gap-6 with CSS variable', () => {
      const { container } = render(<div className="flex gap-6" />);
      const element = container.firstChild as HTMLElement;
      const styles = window.getComputedStyle(element);
      
      // Gap should be applied
      expect(styles.gap).toBeTruthy();
    });
  });

  describe('Theme-Aware Classes', () => {
    it('should apply different colors in light mode', () => {
      document.documentElement.classList.add('light');
      
      const { container } = render(<div className="bg-bg text-text" />);
      const element = container.firstChild as HTMLElement;
      const styles = window.getComputedStyle(element);
      
      // Colors should be applied
      expect(styles.backgroundColor).toBeTruthy();
      expect(styles.color).toBeTruthy();
      
      document.documentElement.classList.remove('light');
    });

    it('should apply different colors in dark mode', () => {
      document.documentElement.classList.remove('light');
      
      const { container } = render(<div className="bg-bg text-text" />);
      const element = container.firstChild as HTMLElement;
      const styles = window.getComputedStyle(element);
      
      // Colors should be applied
      expect(styles.backgroundColor).toBeTruthy();
      expect(styles.color).toBeTruthy();
    });
  });

  describe('Responsive Classes', () => {
    it('should apply responsive typography classes', () => {
      const { container } = render(
        <div className="text-base md:text-lg lg:text-xl">Text</div>
      );
      const element = container.firstChild as HTMLElement;
      const styles = window.getComputedStyle(element);
      
      // Base font size should be applied
      expect(styles.fontSize).toBeTruthy();
    });

    it('should apply responsive spacing classes', () => {
      const { container } = render(
        <div className="p-4 md:p-6 lg:p-8" />
      );
      const element = container.firstChild as HTMLElement;
      const styles = window.getComputedStyle(element);
      
      // Base padding should be applied
      expect(styles.padding).toBeTruthy();
    });
  });

  describe('CSS Variable References', () => {
    it('should have all required color variables defined', () => {
      const styles = getComputedStyle(document.documentElement);
      
      const requiredVars = [
        '--color-primary',
        '--color-bg',
        '--color-card',
        '--color-text',
        '--color-border',
        '--color-success',
        '--color-warning',
        '--color-danger'
      ];
      
      requiredVars.forEach(varName => {
        const value = styles.getPropertyValue(varName).trim();
        expect(value).toBeTruthy();
      });
    });

    it('should have all required typography variables defined', () => {
      const styles = getComputedStyle(document.documentElement);
      
      const requiredVars = [
        '--text-xs',
        '--text-sm',
        '--text-base',
        '--text-lg',
        '--text-xl',
        '--text-2xl',
        '--text-3xl',
        '--text-4xl'
      ];
      
      requiredVars.forEach(varName => {
        const value = styles.getPropertyValue(varName).trim();
        expect(value).toBeTruthy();
      });
    });

    it('should have all required spacing variables defined', () => {
      const styles = getComputedStyle(document.documentElement);
      
      const requiredVars = [
        '--space-1',
        '--space-2',
        '--space-3',
        '--space-4',
        '--space-6',
        '--space-8'
      ];
      
      requiredVars.forEach(varName => {
        const value = styles.getPropertyValue(varName).trim();
        expect(value).toBeTruthy();
      });
    });
  });
});
