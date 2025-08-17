/**
 * Test de la nueva animación simplificada
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock del AudioManager
vi.mock('../../src/utils/AudioManager', () => ({
  default: {
    initialize: vi.fn(),
    playMusic: vi.fn(),
    stopMusic: vi.fn(),
  }
}));

import OpeningAnimation from '../../src/pages/MainMenu/OpeningAnimation';

describe('Nueva Animación Simplificada', () => {
  it('debe mostrar la animación fade in correctamente', async () => {
    const onComplete = vi.fn();
    const onSkip = vi.fn();

    render(<OpeningAnimation onComplete={onComplete} onSkip={onSkip} />);

    // Debe mostrar el texto "Master's" y "Arena"
    await waitFor(() => {
      expect(screen.getByText('Master\'s')).toBeInTheDocument();
      expect(screen.getByText('Arena')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Debe tener las clases de transición correctas
    const masterText = screen.getByText('Master\'s');
    const arenaText = screen.getByText('Arena');
    
    expect(masterText.closest('h1')).toHaveClass('transition-all', 'duration-1000');
    expect(arenaText.closest('h1')).toHaveClass('transition-all', 'duration-1000');
  });

  it('debe mostrar el hint de skip', () => {
    render(<OpeningAnimation onComplete={vi.fn()} onSkip={vi.fn()} />);
    
    expect(screen.getByText('Press ESC to skip')).toBeInTheDocument();
  });

  it('debe permitir hacer click para saltar', () => {
    const onSkip = vi.fn();
    const onComplete = vi.fn();

    render(<OpeningAnimation onComplete={onComplete} onSkip={onSkip} />);
    
    const skipOverlay = screen.getByTitle('Click to skip animation');
    skipOverlay.click();

    expect(onSkip).toHaveBeenCalled();
    expect(onComplete).toHaveBeenCalled();
  });
});
