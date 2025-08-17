/**
 * Frontend Basic Test - Pruebas básicas de funcionamiento
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock del AudioManager correctamente
vi.mock('../../src/utils/AudioManager', () => ({
  default: {
    initialize: vi.fn(),
    playMusic: vi.fn(),
    stopMusic: vi.fn(),
  }
}));

import MainMenu from '../../src/pages/MainMenu/MainMenu';
import MenuButtons from '../../src/pages/MainMenu/MenuButtons';

describe('Frontend Basic Functionality Tests', () => {
  describe('Components Render Successfully', () => {
    it('MainMenu renders without errors', () => {
      expect(() => render(<MainMenu />)).not.toThrow();
    });

    it('MenuButtons renders with props', () => {
      const mockProps = {
        onNewGame: () => console.log('New Game'),
        onLoadGame: () => console.log('Load Game'), 
        onConfiguration: () => console.log('Config')
      };
      
      expect(() => render(<MenuButtons {...mockProps} />)).not.toThrow();
    });
  });

  describe('Button Functionality', () => {
    it('Menu buttons are clickable', () => {
      let clicked = false;
      const handleClick = () => { clicked = true; };

      render(<MenuButtons onNewGame={handleClick} onLoadGame={() => {}} onConfiguration={() => {}} />);
      
      const newGameButton = screen.getByText('New Game');
      fireEvent.click(newGameButton);
      
      expect(clicked).toBe(true);
    });

    it('All three buttons are present', () => {
      render(<MenuButtons onNewGame={() => {}} onLoadGame={() => {}} onConfiguration={() => {}} />);
      
      expect(screen.getByText('New Game')).toBeInTheDocument();
      expect(screen.getByText('Load Game')).toBeInTheDocument(); 
      expect(screen.getByText('Configuration')).toBeInTheDocument();
    });
  });

  describe('CSS Classes Applied', () => {
    it('MainMenu has correct container classes', () => {
      const { container } = render(<MainMenu />);
      const mainDiv = container.firstChild;
      
      expect(mainDiv).toHaveClass('min-h-screen');
      expect(mainDiv).toHaveClass('w-full');
      expect(mainDiv).toHaveClass('relative');
    });

    it('Buttons have Tailwind styling', () => {
      render(<MenuButtons onNewGame={() => {}} onLoadGame={() => {}} onConfiguration={() => {}} />);
      
      const button = screen.getByText('New Game').closest('button');
      expect(button).toHaveClass('group');
      expect(button).toHaveClass('relative');
    });
  });

  describe('Skip Animation Feature', () => {
    it('ESC key handler is set up', () => {
      // Mock addEventListener para verificar que se registra el listener
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
      
      render(<MainMenu />);
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
      
      addEventListenerSpy.mockRestore();
    });
  });
});
