/**
 * MenuButtons.jsx - Botones del menú principal
 */

import React from 'react';

const MenuButtons = ({ onNewGame, onLoadGame, onConfiguration }) => {
    return (
        <div className="absolute inset-0 flex items-center justify-center lg:justify-start z-20 pt-32 sm:pt-40 md:pt-48 lg:pt-0 lg:left-[5%] lg:top-1/2 lg:transform lg:-translate-y-1/2">
            <div className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-[280px] mx-auto lg:mx-0 px-4 sm:px-6 md:px-8 lg:px-0">
                <div className="flex flex-col gap-3 sm:gap-4 md:gap-6 lg:gap-4 items-center lg:items-start animate-[slideInFromLeft_0.8s_ease-out_0.3s_both]">
                    <button 
                        className="group relative w-full lg:w-[250px] bg-gradient-to-br from-amber-900 to-yellow-900 border-2 border-amber-600 text-yellow-400 font-bold px-4 py-3 sm:px-6 sm:py-4 md:px-8 md:py-4 lg:px-6 lg:py-3 cursor-pointer transition-all duration-300 uppercase tracking-wide text-center overflow-hidden shadow-lg hover:shadow-yellow-400/30 hover:shadow-xl hover:-translate-y-1 hover:border-yellow-400 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-gray-900 text-xs sm:text-sm md:text-base lg:text-sm min-h-[48px] touch-manipulation"
                        onClick={onNewGame}
                    >
                        <span className="relative z-10 block group-hover:text-green-300 group-hover:drop-shadow-[0_0_10px_rgb(144,238,144)] transition-all duration-300">
                            New Game
                        </span>
                        <div className="absolute top-0 left-[-100%] w-full h-full bg-gradient-to-r from-transparent via-yellow-400/20 to-transparent transition-all duration-500 group-hover:left-full"></div>
                    </button>

                    <button 
                        className="group relative w-full lg:w-[250px] bg-gradient-to-br from-amber-900 to-yellow-900 border-2 border-amber-600 text-yellow-400 font-bold px-4 py-3 sm:px-6 sm:py-4 md:px-8 md:py-4 lg:px-6 lg:py-3 cursor-pointer transition-all duration-300 uppercase tracking-wide text-center overflow-hidden shadow-lg hover:shadow-yellow-400/30 hover:shadow-xl hover:-translate-y-1 hover:border-yellow-400 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-gray-900 text-xs sm:text-sm md:text-base lg:text-sm min-h-[48px] touch-manipulation"
                        onClick={onLoadGame}
                    >
                        <span className="relative z-10 block group-hover:text-sky-300 group-hover:drop-shadow-[0_0_10px_rgb(135,206,235)] transition-all duration-300">
                            Load Game
                        </span>
                        <div className="absolute top-0 left-[-100%] w-full h-full bg-gradient-to-r from-transparent via-yellow-400/20 to-transparent transition-all duration-500 group-hover:left-full"></div>
                    </button>

                    <button 
                        className="group relative w-full lg:w-[250px] bg-gradient-to-br from-amber-900 to-yellow-900 border-2 border-amber-600 text-yellow-400 font-bold px-4 py-3 sm:px-6 sm:py-4 md:px-8 md:py-4 lg:px-6 lg:py-3 cursor-pointer transition-all duration-300 uppercase tracking-wide text-center overflow-hidden shadow-lg hover:shadow-yellow-400/30 hover:shadow-xl hover:-translate-y-1 hover:border-yellow-400 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-gray-900 text-xs sm:text-sm md:text-base lg:text-sm min-h-[48px] touch-manipulation"
                        onClick={onConfiguration}
                    >
                        <span className="relative z-10 block group-hover:text-purple-300 group-hover:drop-shadow-[0_0_10px_rgb(221,160,221)] transition-all duration-300">
                            Configuration
                        </span>
                        <div className="absolute top-0 left-[-100%] w-full h-full bg-gradient-to-r from-transparent via-yellow-400/20 to-transparent transition-all duration-500 group-hover:left-full"></div>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MenuButtons;
