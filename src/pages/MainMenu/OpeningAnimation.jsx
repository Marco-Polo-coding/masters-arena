/**
 * OpeningAnimation.jsx - Animación de apertura del juego
 */

import React, { useEffect, useState } from 'react';

const OpeningAnimation = ({ onComplete, onSkip }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Iniciar la animación fade in inmediatamente
        const timer1 = setTimeout(() => {
            setIsVisible(true);
        }, 100);

        // Completar la animación después de 2.5 segundos
        const timer2 = setTimeout(() => {
            if (onComplete) onComplete();
        }, 2500);

        // Cleanup timers
        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
        };
    }, [onComplete]);

    const handleSkip = () => {
        if (onSkip) onSkip();
        if (onComplete) onComplete();
    };

    return (
        <div className="fixed inset-0 z-50 bg-gradient-to-br from-gray-900 via-amber-900/20 to-gray-900 overflow-hidden">
            <div className="w-full h-full flex items-center justify-center px-4">
                <div className="relative">
                    <h1 className={`
                        text-4xl sm:text-5xl md:text-7xl lg:text-8xl xl:text-9xl font-bold text-center transition-all duration-1000 ease-out
                        ${isVisible 
                            ? 'opacity-100 translate-y-0 blur-0' 
                            : 'opacity-0 translate-y-8 blur-sm'
                        }
                    `}>
                        <span className="block bg-gradient-to-r from-yellow-300 via-yellow-400 to-orange-400 bg-clip-text text-transparent drop-shadow-2xl">
                            Master's
                        </span>
                        <span className="block bg-gradient-to-r from-orange-400 via-yellow-400 to-yellow-300 bg-clip-text text-transparent drop-shadow-2xl mt-1 sm:mt-2">
                            Arena
                        </span>
                    </h1>
                    
                    {/* Efecto de resplandor sutil */}
                    <div className={`
                        absolute inset-0 bg-gradient-radial from-yellow-400/20 via-transparent to-transparent blur-xl transition-opacity duration-1000
                        ${isVisible ? 'opacity-100' : 'opacity-0'}
                    `}></div>
                </div>
            </div>

            {/* Skip hint */}
            <div className="absolute bottom-8 right-8 z-20">
                {/* <span className={`
                    text-yellow-300/70 text-sm font-mono transition-all duration-500 delay-500
                    ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
                `}>
                    Press ESC to skip
                </span> */}
            </div>

            {/* Overlay para click to skip */}
            <div 
                className="absolute inset-0 cursor-pointer z-10" 
                onClick={handleSkip}
                title="Click to skip animation"
            ></div>
        </div>
    );
};

export default OpeningAnimation;
