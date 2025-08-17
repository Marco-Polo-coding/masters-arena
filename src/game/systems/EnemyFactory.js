/**
 * EnemyFactory.js - Factory para crear enemigos según especificaciones
 * Maneja la lógica de creación de enemigos basada en stage, tipo y dificultad
 */

import Goblin from '../classes/Goblin.js';
import Knoll from '../classes/Knoll.js';
import GiantLizard from '../classes/GiantLizard.js';
import GladiatorWarrior from '../classes/GladiatorWarrior.js';
// TODO: Import GladiatorRogue and GladiatorMage cuando estén creados

class EnemyFactory {
    constructor() {
        // Configuración de aparición de enemigos por stage
        this.enemySpawns = {
            1: {
                common: ['goblin', 'knoll'],
                uncommon: ['giant_lizard'],
                boss: ['gladiator_warrior'] // TODO: Añadir otros gladiators
            },
            2: {
                common: ['goblin', 'knoll'],
                uncommon: ['giant_lizard'],
                boss: ['gladiator_warrior'] // TODO: Añadir otros gladiators
            },
            3: {
                common: ['knoll', 'giant_lizard'],
                uncommon: ['goblin'], // Goblins más raros en stage 3
                boss: ['gladiator_warrior'] // Final bosses
            }
        };

        // Perfiles de dificultad disponibles
        this.difficultyProfiles = ['normal', 'aggressive'];
        
        // Mapeo de tipos a clases
        this.enemyClasses = {
            'goblin': Goblin,
            'knoll': Knoll,
            'giant_lizard': GiantLizard,
            'gladiator_warrior': GladiatorWarrior
            // TODO: Añadir 'gladiator_rogue' y 'gladiator_mage'
        };
    }

    /**
     * Crea un enemigo específico
     * @param {string} enemyType - Tipo de enemigo ('goblin', 'knoll', etc.)
     * @param {number} stage - Stage actual (1, 2, 3)
     * @param {number} playerLevel - Nivel del jugador
     * @param {Object} playerStats - Stats del jugador para calcular proporciones
     * @param {string} profile - Perfil de dificultad ('normal', 'aggressive')
     * @returns {BaseEnemy} Instancia del enemigo creado
     */
    createEnemy(enemyType, stage, playerLevel, playerStats, profile = 'normal') {
        const EnemyClass = this.enemyClasses[enemyType];
        
        if (!EnemyClass) {
            throw new Error(`Unknown enemy type: ${enemyType}`);
        }

        if (stage < 1 || stage > 3) {
            throw new Error(`Invalid stage: ${stage}. Must be 1, 2, or 3.`);
        }

        if (!this.difficultyProfiles.includes(profile)) {
            throw new Error(`Invalid difficulty profile: ${profile}`);
        }

        return new EnemyClass(stage, playerLevel, playerStats, profile);
    }

    /**
     * Crea un enemigo aleatorio basado en stage y probabilidades
     * @param {number} stage - Stage actual
     * @param {number} playerLevel - Nivel del jugador
     * @param {Object} playerStats - Stats del jugador
     * @param {string} encounterType - Tipo de encuentro ('common', 'uncommon', 'boss')
     * @param {string} profile - Perfil de dificultad
     * @returns {BaseEnemy} Enemigo aleatorio creado
     */
    createRandomEnemy(stage, playerLevel, playerStats, encounterType = 'common', profile = 'normal') {
        const availableEnemies = this.enemySpawns[stage][encounterType];
        
        if (!availableEnemies || availableEnemies.length === 0) {
            throw new Error(`No enemies available for stage ${stage}, encounter type ${encounterType}`);
        }

        const randomEnemyType = availableEnemies[Math.floor(Math.random() * availableEnemies.length)];
        return this.createEnemy(randomEnemyType, stage, playerLevel, playerStats, profile);
    }

    /**
     * Genera encuentros para un stage completo
     * @param {number} stage - Stage actual
     * @param {number} playerLevel - Nivel del jugador
     * @param {Object} playerStats - Stats del jugador
     * @param {number} encounterCount - Número de encuentros a generar
     * @param {string} profile - Perfil de dificultad base
     * @returns {Array} Array de enemigos para el stage
     */
    generateStageEncounters(stage, playerLevel, playerStats, encounterCount = 5, profile = 'normal') {
        const encounters = [];
        
        // Distribución típica de encuentros:
        // 60% common, 30% uncommon, 10% elite (aggressive profile)
        const encounterDistribution = [
            ...Array(Math.ceil(encounterCount * 0.6)).fill('common'),
            ...Array(Math.ceil(encounterCount * 0.3)).fill('uncommon'),
            ...Array(Math.floor(encounterCount * 0.1)).fill('common') // Algunos common adicionales con profile aggressive
        ];

        // Shuffle para aleatoriedad
        for (let i = encounterDistribution.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [encounterDistribution[i], encounterDistribution[j]] = [encounterDistribution[j], encounterDistribution[i]];
        }

        for (let i = 0; i < encounterCount; i++) {
            const encounterType = encounterDistribution[i] || 'common';
            
            // Algunos encounters tienen profile aggressive
            let encounterProfile = profile;
            if (Math.random() < 0.2) { // 20% chance de aggressive
                encounterProfile = 'aggressive';
            }

            const enemy = this.createRandomEnemy(stage, playerLevel, playerStats, encounterType, encounterProfile);
            encounters.push({
                enemy: enemy,
                encounterType: encounterType,
                profile: encounterProfile,
                index: i + 1
            });
        }

        return encounters;
    }

    /**
     * Crea el boss final de un stage
     * @param {number} stage - Stage actual
     * @param {number} playerLevel - Nivel del jugador
     * @param {Object} playerStats - Stats del jugador
     * @param {string} gladiatorType - Tipo específico de gladiator ('warrior', 'rogue', 'mage')
     * @returns {BaseEnemy} Boss del stage
     */
    createStageBoss(stage, playerLevel, playerStats, gladiatorType = null) {
        if (stage === 3 && !gladiatorType) {
            // En stage 3, elegir gladiator aleatorio para el final
            const gladiatorTypes = ['warrior']; // TODO: Añadir 'rogue', 'mage' cuando estén listos
            gladiatorType = gladiatorTypes[Math.floor(Math.random() * gladiatorTypes.length)];
        } else if (!gladiatorType) {
            gladiatorType = 'warrior'; // Default para stages 1 y 2
        }

        const bossType = `gladiator_${gladiatorType}`;
        
        // Los bosses siempre tienen profile normal (ya son suficientemente difíciles)
        return this.createEnemy(bossType, stage, playerLevel, playerStats, 'normal');
    }

    /**
     * Obtiene información sobre enemigos disponibles en un stage
     * @param {number} stage - Stage a consultar
     * @returns {Object} Información de enemigos disponibles
     */
    getStageEnemyInfo(stage) {
        if (!this.enemySpawns[stage]) {
            throw new Error(`Invalid stage: ${stage}`);
        }

        const stageData = this.enemySpawns[stage];
        
        return {
            stage: stage,
            commonEnemies: stageData.common,
            uncommonEnemies: stageData.uncommon,
            bossEnemies: stageData.boss,
            totalTypes: stageData.common.length + stageData.uncommon.length + stageData.boss.length
        };
    }

    /**
     * Obtiene stats de ejemplo para testing
     * @param {number} level - Nivel del jugador simulado
     * @returns {Object} Stats de ejemplo
     */
    getTestPlayerStats(level) {
        // Stats basados en el BaseClass que creamos
        const baseStats = {
            maxHP: 100 + (level - 1) * 20,
            attack: 6 + (level - 1) * 6,
            defense: 8 + (level - 1) * 2,
            initiative: 10 + (level - 1) * 1
        };

        return baseStats;
    }

    /**
     * Método de testing para crear enemigos de ejemplo
     * @param {number} level - Nivel de testing
     * @returns {Array} Array de enemigos de ejemplo
     */
    createTestEnemies(level = 1) {
        const testStats = this.getTestPlayerStats(level);
        const testEnemies = [];

        // Crear un ejemplo de cada tipo de enemigo
        const enemyTypes = ['goblin', 'knoll', 'giant_lizard', 'gladiator_warrior'];
        
        enemyTypes.forEach(type => {
            try {
                const normalEnemy = this.createEnemy(type, 1, level, testStats, 'normal');
                const aggressiveEnemy = this.createEnemy(type, 1, level, testStats, 'aggressive');
                
                testEnemies.push({
                    type: type,
                    normal: normalEnemy.getDisplayInfo(),
                    aggressive: aggressiveEnemy.getDisplayInfo()
                });
            } catch (error) {
                console.warn(`Could not create test enemy of type ${type}:`, error.message);
            }
        });

        return testEnemies;
    }

    /**
     * Valida que un enemigo tenga las stats correctas según las proporciones
     * @param {BaseEnemy} enemy - Enemigo a validar
     * @param {Object} playerStats - Stats del jugador para comparar
     * @returns {Object} Resultado de la validación
     */
    validateEnemyStats(enemy, playerStats) {
        const expectedMultipliers = {
            'small_humanoid': { hp: 0.25, attack: 0.25, defense: 0.25, initiative: 0.25 },
            'medium_beast': { hp: 0.5, attack: 0.5, defense: 0.5, initiative: 0.5 },
            'large_beast': { hp: 1.2, attack: 0.75, defense: 0.75, initiative: 0.75 },
            'gladiator': { hp: 1.0, attack: 1.0, defense: 1.0, initiative: 1.0 }
        };

        const expected = expectedMultipliers[enemy.type];
        const actual = {
            hp: enemy.maxHP / playerStats.maxHP,
            attack: enemy.attackStat / playerStats.attack,
            defense: enemy.defenseStat / playerStats.defense,
            initiative: enemy.initiativeStat / playerStats.initiative
        };

        const tolerance = 0.2; // 20% tolerance for rounding and bonuses
        const isValid = Object.keys(expected).every(stat => {
            const diff = Math.abs(actual[stat] - expected[stat]);
            return diff <= tolerance;
        });

        return {
            isValid: isValid,
            expected: expected,
            actual: actual,
            enemyType: enemy.type,
            enemyName: enemy.name
        };
    }

    /**
     * Obtiene los enemigos disponibles para un stage específico
     */
    getAvailableEnemies(stage) {
        const availableByStage = {
            1: ['goblin', 'knoll'],
            2: ['goblin', 'knoll', 'giant_lizard'],
            3: ['knoll', 'giant_lizard', 'gladiator_warrior']
        };
        
        return availableByStage[stage] || [];
    }
}

export default EnemyFactory;
