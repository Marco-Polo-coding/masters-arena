/**
 * MainMenu.jsx - Menú principal con animación de apertura
 */

import React, { useState, useEffect } from 'react';
import OpeningAnimation from './OpeningAnimation';
import MenuButtons from './MenuButtons';
import AudioManager from '../../utils/AudioManager';

const MainMenu = () => {
    const [showAnimation, setShowAnimation] = useState(true);
    const [showMenu, setShowMenu] = useState(false);
    const [skipAnimation, setSkipAnimation] = useState(false);

    useEffect(() => {
        // Inicializar sistema de audio
        AudioManager.initialize();
        
        // Reproducir música de menú
        AudioManager.playMusic('menu');

        // Listener para ESC key (saltar animación)
        const handleEscapeKey = (event) => {
            if (event.key === 'Escape' && showAnimation) {
                setSkipAnimation(true);
                handleAnimationComplete();
            }
        };

        document.addEventListener('keydown', handleEscapeKey);
        return () => {
            document.removeEventListener('keydown', handleEscapeKey);
        };
    }, [showAnimation]);

    const handleAnimationComplete = () => {
        setShowAnimation(false);
        setShowMenu(true);
    };

    const handleNewGame = () => {
        // TODO: Navegar a Character Creation
        console.log('New Game clicked');
    };

    const handleLoadGame = () => {
        // TODO: Navegar a Load Game
        console.log('Load Game clicked');
    };

    const handleConfiguration = () => {
        // TODO: Abrir modal de configuración
        console.log('Configuration clicked');
    };

    return (
        <div className="min-h-screen w-full relative overflow-hidden bg-gradient-to-br from-gray-900 via-amber-900/20 to-gray-900">
            {showAnimation && !skipAnimation && (
                <OpeningAnimation 
                    onComplete={handleAnimationComplete}
                    onSkip={() => setSkipAnimation(true)}
                />
            )}
            
            {showMenu && (
                <>
                    {/* Título en el menú principal */}
                    <div className="absolute top-12 sm:top-16 md:top-20 lg:top-1/2 left-1/2 transform -translate-x-1/2 lg:-translate-y-1/2 z-10 px-4 w-full lg:w-auto">
                        <h1 className="text-6xl sm:text-8xl md:text-8xl lg:text-6xl xl:text-7xl 2xl:text-8xl font-bold text-yellow-400 text-center tracking-wider animate-pulse leading-tight">
                            <span className="block lg:inline">Master's</span>
                            <span className="block lg:inline lg:ml-4">Arena</span>
                        </h1>
                    </div>
                    
                    <MenuButtons
                        onNewGame={handleNewGame}
                        onLoadGame={handleLoadGame}
                        onConfiguration={handleConfiguration}
                    />
                </>
            )}

            {/* Settings gear NO aparece en el menú inicial según especificaciones */}
        </div>
    );
};

export default MainMenu;
