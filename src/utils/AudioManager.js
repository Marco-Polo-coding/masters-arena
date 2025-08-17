/**
 * AudioManager.js - Sistema de gestión de audio del juego
 */

class AudioManager {
    constructor() {
        this.audioContext = null;
        this.musicVolume = 0.7;
        this.sfxVolume = 0.8;
        this.isMuted = false;
        this.currentMusic = null;
        this.audioCache = new Map();
        this.initialized = false;
    }

    /**
     * Inicializar el sistema de audio
     */
    initialize() {
        if (this.initialized) return;

        try {
            // Crear AudioContext (con fallback)
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.audioContext = new AudioContext();
            }

            // Cargar configuración desde localStorage
            this.loadSettings();
            
            this.initialized = true;
            console.log('AudioManager initialized successfully');
        } catch (error) {
            console.warn('AudioManager initialization failed:', error);
            // Fallback: sistema funciona sin audio
            this.initialized = false;
        }
    }

    /**
     * Cargar configuración de audio
     */
    loadSettings() {
        const savedSettings = localStorage.getItem('masters-arena-audio');
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            this.musicVolume = settings.musicVolume || 0.7;
            this.sfxVolume = settings.sfxVolume || 0.8;
            this.isMuted = settings.isMuted || false;
        }
    }

    /**
     * Guardar configuración de audio
     */
    saveSettings() {
        const settings = {
            musicVolume: this.musicVolume,
            sfxVolume: this.sfxVolume,
            isMuted: this.isMuted
        };
        localStorage.setItem('masters-arena-audio', JSON.stringify(settings));
    }

    /**
     * Reproducir música de fondo
     */
    async playMusic(trackName) {
        if (!this.initialized || this.isMuted) return;

        try {
            // Detener música actual
            if (this.currentMusic) {
                this.currentMusic.pause();
            }

            // Obtener track de audio
            const audioElement = await this.getAudioElement(trackName, 'music');
            if (!audioElement) return;

            audioElement.volume = this.musicVolume;
            audioElement.loop = true;
            
            const playPromise = audioElement.play();
            if (playPromise !== undefined) {
                await playPromise;
                this.currentMusic = audioElement;
            }
        } catch (error) {
            console.warn(`Failed to play music ${trackName}:`, error);
        }
    }

    /**
     * Reproducir efecto de sonido
     */
    async playSFX(soundName) {
        if (!this.initialized || this.isMuted) return;

        try {
            const audioElement = await this.getAudioElement(soundName, 'sfx');
            if (!audioElement) return;

            // Clonar el elemento para permitir múltiples reproducciones
            const sfxClone = audioElement.cloneNode();
            sfxClone.volume = this.sfxVolume;
            
            const playPromise = sfxClone.play();
            if (playPromise !== undefined) {
                await playPromise;
            }
        } catch (error) {
            console.warn(`Failed to play SFX ${soundName}:`, error);
        }
    }

    /**
     * Obtener elemento de audio (con caché y fallbacks)
     */
    async getAudioElement(name, type) {
        const cacheKey = `${type}-${name}`;
        
        // Verificar caché
        if (this.audioCache.has(cacheKey)) {
            return this.audioCache.get(cacheKey);
        }

        // Intentar cargar audio
        const audioElement = await this.loadAudio(name, type);
        if (audioElement) {
            this.audioCache.set(cacheKey, audioElement);
            return audioElement;
        }

        return null;
    }

    /**
     * Cargar archivo de audio con fallbacks
     */
    async loadAudio(name, type) {
        const audioSources = this.getAudioSources(name, type);
        
        for (const source of audioSources) {
            try {
                const audio = new Audio();
                audio.preload = 'auto';
                
                // Promesa para verificar si el audio se carga correctamente
                const loadPromise = new Promise((resolve, reject) => {
                    audio.oncanplaythrough = () => resolve(audio);
                    audio.onerror = () => reject(new Error(`Failed to load ${source}`));
                    audio.src = source;
                });

                const loadedAudio = await Promise.race([
                    loadPromise,
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Timeout')), 3000)
                    )
                ]);

                return loadedAudio;
            } catch (error) {
                console.warn(`Failed to load audio from ${source}:`, error);
                continue;
            }
        }

        console.warn(`All audio sources failed for ${name}`);
        return null;
    }

    /**
     * Obtener fuentes de audio con fallbacks
     */
    getAudioSources(name, type) {
        const sources = [];
        
        if (type === 'music') {
            switch (name) {
                case 'menu':
                    // Fuente principal: Audio libre local
                    sources.push('/assets/audio/music/menu-theme.mp3');
                    // Fallback: CDN de audio libre
                    sources.push('https://www.soundjay.com/misc/sounds/bell-ringing-05.wav'); // Placeholder
                    // Fallback: Música clásica de dominio público
                    sources.push('https://ia800102.us.archive.org/35/items/MusOpen_-_Grieg_-_Peer_Gynt_-_Suite_No._1/02_-_Death_of_Ase.mp3');
                    break;
                case 'combat':
                    sources.push('/assets/audio/music/combat-theme.mp3');
                    break;
                default:
                    console.warn(`Unknown music track: ${name}`);
            }
        } else if (type === 'sfx') {
            switch (name) {
                case 'button-hover':
                    sources.push('/assets/audio/sfx/button-hover.wav');
                    break;
                case 'button-click':
                    sources.push('/assets/audio/sfx/button-click.wav');
                    break;
                case 'sword-clash':
                    sources.push('/assets/audio/sfx/sword-clash.wav');
                    break;
                default:
                    console.warn(`Unknown SFX: ${name}`);
            }
        }

        return sources;
    }

    /**
     * Controles de volumen
     */
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        if (this.currentMusic) {
            this.currentMusic.volume = this.isMuted ? 0 : this.musicVolume;
        }
        this.saveSettings();
    }

    setSFXVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        this.saveSettings();
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.currentMusic) {
            this.currentMusic.volume = this.isMuted ? 0 : this.musicVolume;
        }
        this.saveSettings();
        return this.isMuted;
    }

    /**
     * Getters para la UI
     */
    getMusicVolume() {
        return this.musicVolume;
    }

    getSFXVolume() {
        return this.sfxVolume;
    }

    getIsMuted() {
        return this.isMuted;
    }

    /**
     * Cleanup
     */
    dispose() {
        if (this.currentMusic) {
            this.currentMusic.pause();
            this.currentMusic = null;
        }
        
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        
        this.audioCache.clear();
        this.initialized = false;
    }
}

// Singleton instance
const audioManager = new AudioManager();

export default audioManager;
