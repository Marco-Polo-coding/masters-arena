/**
 * Frontend Integration Test
 * Prueba completa del menú principal y sus funcionalidades
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock AudioManager para las pruebas
vi.mock('../../src/utils/AudioManager', () => ({
  default: {
    initialize: vi.fn(),
    playMusic: vi.fn(),
    stopMusic: vi.fn(),
    playSound: vi.fn(),
    setMusicVolume: vi.fn(),
    setSfxVolume: vi.fn(),
    toggleMute: vi.fn()
  }
}));

// Componentes a probar
import MainMenu from '../../src/pages/MainMenu/MainMenu';
import OpeningAnimation from '../../src/pages/MainMenu/OpeningAnimation';
import MenuButtons from '../../src/pages/MainMenu/MenuButtons';

describe('Frontend Integration Tests', () => {
  beforeEach(() => {
    // Limpiar mocks antes de cada test
    vi.clearAllMocks();
    
    // Mock addEventListener y removeEventListener
    global.addEventListener = vi.fn();
    global.removeEventListener = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('MainMenu Component', () => {
    it('should render without crashing', () => {
      render(<MainMenu />);
      expect(screen.getByText(/master's arena/i)).toBeInTheDocument();
    });

    it('should show opening animation initially', () => {
      render(<MainMenu />);
      // La animación debe estar visible al inicio
      const animationContainer = document.querySelector('[class*="fixed inset-0"]');
      expect(animationContainer).toBeInTheDocument();
    });

    it('should handle ESC key to skip animation', async () => {
      render(<MainMenu />);
      
      // Simular presionar ESC
      fireEvent.keyDown(document, { key: 'Escape', keyCode: 27 });
      
      // El menú debe aparecer después de saltar la animación
      await waitFor(() => {
        expect(screen.getByText('New Game')).toBeInTheDocument();
      });
    });

    it('should initialize AudioManager on mount', () => {
      const AudioManager = require('../../src/utils/AudioManager').default;
      render(<MainMenu />);
      
      expect(AudioManager.initialize).toHaveBeenCalled();
      expect(AudioManager.playMusic).toHaveBeenCalledWith('menu');
    });
  });

  describe('OpeningAnimation Component', () => {
    const mockProps = {
      onComplete: vi.fn(),
      onSkip: vi.fn()
    };

    beforeEach(() => {
      // Mock setTimeout para controlar los timers
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should render with initial animation phase', () => {
      render(<OpeningAnimation {...mockProps} />);
      
      const container = screen.getByRole('button', { hidden: true }); // El overlay clickeable
      expect(container).toBeInTheDocument();
    });

    it('should call onComplete after animation sequence', () => {
      render(<OpeningAnimation {...mockProps} />);
      
      // Avanzar todos los timers
      vi.runAllTimers();
      
      expect(mockProps.onComplete).toHaveBeenCalled();
    });

    it('should handle click to skip', () => {
      render(<OpeningAnimation {...mockProps} />);
      
      const skipOverlay = document.querySelector('[title="Click to skip animation"]');
      fireEvent.click(skipOverlay);
      
      expect(mockProps.onSkip).toHaveBeenCalled();
      expect(mockProps.onComplete).toHaveBeenCalled();
    });

    it('should render skip hint text', () => {
      render(<OpeningAnimation {...mockProps} />);
      expect(screen.getByText('Press ESC to skip')).toBeInTheDocument();
    });
  });

  describe('MenuButtons Component', () => {
    const mockProps = {
      onNewGame: vi.fn(),
      onLoadGame: vi.fn(),
      onConfiguration: vi.fn()
    };

    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should render all menu buttons', () => {
      render(<MenuButtons {...mockProps} />);
      
      expect(screen.getByText('New Game')).toBeInTheDocument();
      expect(screen.getByText('Load Game')).toBeInTheDocument();
      expect(screen.getByText('Configuration')).toBeInTheDocument();
    });

    it('should handle New Game button click', () => {
      render(<MenuButtons {...mockProps} />);
      
      const newGameButton = screen.getByText('New Game');
      fireEvent.click(newGameButton);
      
      expect(mockProps.onNewGame).toHaveBeenCalledTimes(1);
    });

    it('should handle Load Game button click', () => {
      render(<MenuButtons {...mockProps} />);
      
      const loadGameButton = screen.getByText('Load Game');
      fireEvent.click(loadGameButton);
      
      expect(mockProps.onLoadGame).toHaveBeenCalledTimes(1);
    });

    it('should handle Configuration button click', () => {
      render(<MenuButtons {...mockProps} />);
      
      const configButton = screen.getByText('Configuration');
      fireEvent.click(configButton);
      
      expect(mockProps.onConfiguration).toHaveBeenCalledTimes(1);
    });

    it('should have proper CSS classes for styling', () => {
      render(<MenuButtons {...mockProps} />);
      
      const newGameButton = screen.getByText('New Game').closest('button');
      expect(newGameButton).toHaveClass('group', 'relative', 'bg-gradient-to-br');
    });
  });

  describe('Tailwind CSS Integration', () => {
    it('should apply Tailwind classes correctly', () => {
      render(<MainMenu />);
      
      const container = document.querySelector('.min-h-screen');
      expect(container).toBeInTheDocument();
      expect(container).toHaveClass('w-full', 'relative', 'overflow-hidden');
    });

    it('should have responsive design classes', () => {
      render(<MenuButtons onNewGame={vi.fn()} onLoadGame={vi.fn()} onConfiguration={vi.fn()} />);
      
      const button = screen.getByText('New Game').closest('button');
      expect(button).toHaveClass('min-w-[200px]');
    });
  });

  describe('Accessibility Tests', () => {
    it('should have proper focus states on buttons', () => {
      render(<MenuButtons onNewGame={vi.fn()} onLoadGame={vi.fn()} onConfiguration={vi.fn()} />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveClass('focus:outline-none', 'focus:ring-2');
      });
    });

    it('should have proper ARIA labels where needed', () => {
      render(<OpeningAnimation onComplete={vi.fn()} onSkip={vi.fn()} />);
      
      const skipOverlay = document.querySelector('[title="Click to skip animation"]');
      expect(skipOverlay).toHaveAttribute('title');
    });
  });

  describe('Animation Performance', () => {
    it('should not create memory leaks with timers', () => {
      const { unmount } = render(<OpeningAnimation onComplete={vi.fn()} onSkip={vi.fn()} />);
      
      // Desmontar el componente
      unmount();
      
      // Los timers deben ser limpiados automáticamente
      expect(vi.getTimerCount()).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing props gracefully', () => {
      // Test sin props requeridas
      expect(() => {
        render(<MenuButtons />);
      }).not.toThrow();
    });

    it('should handle AudioManager errors gracefully', () => {
      const AudioManager = require('../../src/utils/AudioManager').default;
      AudioManager.initialize.mockImplementation(() => {
        throw new Error('Audio initialization failed');
      });

      // No debe crashear si AudioManager falla
      expect(() => {
        render(<MainMenu />);
      }).not.toThrow();
    });
  });
});

// Test de integración completo
describe('Complete Frontend Integration Flow', () => {
  it('should complete full menu flow', async () => {
    const { rerender } = render(<MainMenu />);
    
    // 1. Animación inicial debe estar presente
    expect(document.querySelector('[class*="fixed inset-0"]')).toBeInTheDocument();
    
    // 2. Saltar animación con ESC
    fireEvent.keyDown(document, { key: 'Escape', keyCode: 27 });
    
    // 3. Menú debe aparecer
    await waitFor(() => {
      expect(screen.getByText('New Game')).toBeInTheDocument();
    });
    
    // 4. Botones deben ser clickeables
    const newGameButton = screen.getByText('New Game');
    expect(newGameButton).toBeEnabled();
    
    // 5. Click debe funcionar (verificar en consola)
    const consoleSpy = vi.spyOn(console, 'log');
    fireEvent.click(newGameButton);
    expect(consoleSpy).toHaveBeenCalledWith('New Game clicked');
    
    consoleSpy.mockRestore();
  });
});
