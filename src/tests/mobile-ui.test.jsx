/**
 * mobile-ui.test.jsx - Tests específicos para la UI móvil
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import MainMenu from '../pages/MainMenu/MainMenu';

// Mock del AudioManager
vi.mock('../utils/AudioManager', () => ({
  default: {
    initialize: vi.fn(),
    playMusic: vi.fn(),
  }
}));

describe('UI Móvil', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe tener texto responsivo en la animación de apertura', () => {
    render(<MainMenu />);
    
    const titleElements = screen.getAllByText(/Master's|Arena/);
    expect(titleElements.length).toBeGreaterThan(0);
    
    // Verificar que los elementos del título existen
    titleElements.forEach(element => {
      expect(element).toBeInTheDocument();
    });
  });

  it('debe mostrar botones con altura mínima para touch en móvil', async () => {
    render(<MainMenu />);
    
    // Esperar a que aparezca el menú (después de la animación)
    await new Promise(resolve => setTimeout(resolve, 2600));
    
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(3);
    
    // Verificar que los botones tienen las clases de altura mínima
    buttons.forEach(button => {
      expect(button).toHaveClass('min-h-[48px]');
      expect(button).toHaveClass('touch-manipulation');
    });
  });

  it('debe usar tamaños de texto responsivos en los botones', async () => {
    render(<MainMenu />);
    
    // Esperar a que aparezca el menú
    await new Promise(resolve => setTimeout(resolve, 2600));
    
    const newGameButton = screen.getByRole('button', { name: /new game/i });
    const loadGameButton = screen.getByRole('button', { name: /load game/i });
    const configButton = screen.getByRole('button', { name: /configuration/i });
    
    // Verificar que tienen clases de texto responsivo
    [newGameButton, loadGameButton, configButton].forEach(button => {
      expect(button).toHaveClass('text-xs');
      expect(button).toHaveClass('sm:text-sm');
      expect(button).toHaveClass('md:text-base');
    });
  });

  it('debe tener padding responsivo en los botones', async () => {
    render(<MainMenu />);
    
    // Esperar a que aparezca el menú
    await new Promise(resolve => setTimeout(resolve, 2600));
    
    const buttons = screen.getAllByRole('button');
    
    buttons.forEach(button => {
      // Verificar padding responsivo
      expect(button).toHaveClass('px-4');
      expect(button).toHaveClass('sm:px-6');
      expect(button).toHaveClass('md:px-8');
      expect(button).toHaveClass('py-3');
      expect(button).toHaveClass('sm:py-4');
      expect(button).toHaveClass('md:py-4');
    });
  });
});
