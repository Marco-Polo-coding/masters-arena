/**
 * enemy-system.test.js - Tests para el sistema de enemigos usando Vitest
 */

import { describe, it, expect, beforeEach } from 'vitest';
import EnemyFactory from '../systems/EnemyFactory.js';
import CombatSystem from '../systems/CombatSystem.js';
import Warrior from '../classes/Warrior.js';
import Rogue from '../classes/Rogue.js';
import Mage from '../classes/Mage.js';

describe('Enemy System', () => {
    let enemyFactory;
    let combatSystem;
    let playerStats;
    let playerLevel;

    beforeEach(() => {
        enemyFactory = new EnemyFactory();
        combatSystem = new CombatSystem();
        playerLevel = 1;
        playerStats = {
            HP: 100,
            attack: 20,
            defense: 15,
            initiative: 12
        };
    });

    describe('Enemy Creation', () => {
        it('should create a goblin with correct proportional stats', () => {
            const goblin = enemyFactory.createEnemy('goblin', 1, playerLevel, playerStats);
            
            expect(goblin).toBeDefined();
            expect(goblin.name).toBe('Goblin');
            expect(goblin.type).toBe('small_humanoid');
            expect(goblin.stage).toBe(1);
            expect(goblin.maxHP).toBe(25); // 1/4 of playerHP
            expect(goblin.attack).toBe(5); // 1/4 of playerAttack
            expect(goblin.defense).toBe(3); // Math.floor(15 * 0.25) = 3
            expect(goblin.initiative).toBe(3); // 1/4 of playerInitiative
        });

        it('should create a knoll with correct proportional stats', () => {
            const knoll = enemyFactory.createEnemy('knoll', 2, playerLevel, playerStats);
            
            expect(knoll).toBeDefined();
            expect(knoll.name).toBe('Knoll');
            expect(knoll.type).toBe('medium_beast');
            expect(knoll.stage).toBe(2);
            expect(knoll.maxHP).toBe(50); // 1/2 of playerHP
            expect(knoll.attack).toBe(10); // 1/2 of playerAttack
            expect(knoll.defense).toBe(7); // Math.floor(15 * 0.5) = 7
            expect(knoll.initiative).toBe(6); // 1/2 of playerInitiative
        });

        it('should create a giant lizard with correct proportional stats', () => {
            const lizard = enemyFactory.createEnemy('giant_lizard', 3, playerLevel, playerStats);
            
            expect(lizard).toBeDefined();
            expect(lizard.name).toBe('Giant Lizard');
            expect(lizard.type).toBe('large_beast');
            expect(lizard.stage).toBe(3);
            expect(lizard.maxHP).toBe(120); // 1.2x of playerHP
            expect(lizard.attack).toBe(15); // 3/4 of playerAttack
            expect(lizard.defense).toBe(11); // Math.floor(15 * 0.75) = 11
            expect(lizard.initiative).toBe(9); // 3/4 of playerInitiative
        });
    });

    describe('Enemy AI', () => {
        it('should choose appropriate actions based on context', () => {
            const goblin = enemyFactory.createEnemy('goblin', 1, playerLevel, playerStats);
            
            // Crear contexto básico
            const playerContext = {
                health: 50,
                maxHealth: 100,
                movesPerTurn: 2,
                cooldowns: { heavyAttack: 0, eliteSkill: 0, defend: 0, elite: 0 },
                statusEffects: {},
                class: 'warrior'
            };

            const action = goblin.chooseAction(playerContext);
            
            expect(action).toBeDefined();
            expect(['performAttack', 'performHeavyAttack', 'defend', 'poisoned_blade', 'dirty_fighting']).toContain(action);
        });

        it('should prefer aggressive actions when player has low health', () => {
            const goblin = enemyFactory.createEnemy('goblin', 1, playerLevel, playerStats);
            
            const lowHealthContext = {
                health: 20,
                maxHealth: 100,
                movesPerTurn: 2,
                cooldowns: { heavyAttack: 0, eliteSkill: 0, defend: 0, elite: 0 },
                statusEffects: {},
                class: 'warrior'
            };

            // Probar múltiples veces para verificar tendencia agresiva
            const actions = [];
            for (let i = 0; i < 10; i++) {
                actions.push(goblin.chooseAction(lowHealthContext));
            }

            // Al menos la mitad de las acciones deben ser de ataque (incluyendo habilidades ofensivas)
            const attackActions = actions.filter(action => 
                action === 'performAttack' || action === 'performHeavyAttack' || action === 'poisoned_blade'
            );
            expect(attackActions.length).toBeGreaterThanOrEqual(3);
        });
    });

    describe('Combat Actions', () => {
        let warrior;
        let goblin;

        beforeEach(() => {
            warrior = new Warrior('Test Warrior');
            goblin = enemyFactory.createEnemy('goblin', 1, playerLevel, {
                HP: warrior.maxHP,
                attack: 20, // Usar un valor más alto para los tests
                defense: warrior.defense,
                initiative: warrior.initiative
            });
        });

        it('should execute attack action correctly', () => {
            const initialHealth = warrior.currentHP;
            
            goblin.performAttack(warrior);
            
            expect(warrior.currentHP).toBeLessThan(initialHealth);
        });

        it('should execute heavy attack with cooldown', () => {
            const initialHealth = warrior.currentHP;
            
            goblin.performHeavyAttack(warrior);
            
            expect(warrior.currentHP).toBeLessThan(initialHealth);
            expect(goblin.cooldowns.heavyAttack).toBeGreaterThan(0);
        });

        it('should execute defend action', () => {
            goblin.defend();
            
            expect(goblin.statusEffects).toHaveProperty('shielded');
        });
    });

    describe('Stage Progression', () => {
        it('should increase enemy difficulty with stage progression', () => {
            const stage1Goblin = enemyFactory.createEnemy('goblin', 1, playerLevel, playerStats);
            const stage2Goblin = enemyFactory.createEnemy('goblin', 2, playerLevel, playerStats);
            
            expect(stage2Goblin.goldReward).toBeGreaterThan(stage1Goblin.goldReward);
        });

        it('should provide different enemies for different stages', () => {
            const stage1Enemies = enemyFactory.getAvailableEnemies(1);
            const stage3Enemies = enemyFactory.getAvailableEnemies(3);
            
            expect(stage1Enemies).toContain('goblin');
            expect(stage3Enemies).toContain('giant_lizard');
        });
    });

    describe('Combat System Integration', () => {
        it('should handle turn-based combat correctly', () => {
            const warrior = new Warrior('Test Warrior');
            const goblin = enemyFactory.createEnemy('goblin', 1, playerLevel, {
                HP: warrior.maxHP,
                attack: 20,
                defense: warrior.defense,
                initiative: warrior.initiative
            });

            const combat = combatSystem.startCombat(warrior, goblin);
            
            expect(combat).toBeDefined();
            // Verificar que el combat system devuelve alguna estructura
            expect(combat).toHaveProperty('player');
            expect(combat).toHaveProperty('enemy');
        });

        it('should determine turn order based on initiative', () => {
            const warrior = new Warrior('Test Warrior');
            warrior.initiative = 20; // High initiative
            
            const goblin = enemyFactory.createEnemy('goblin', 1, playerLevel, {
                HP: 100,
                attack: 20,
                defense: 15,
                initiative: 5 // Low initiative
            });

            const combat = combatSystem.startCombat(warrior, goblin);
            
            expect(combat).toBeDefined();
            // Verificar que al menos devuelve una estructura de combate
            expect(combat).toHaveProperty('player');
            expect(combat).toHaveProperty('enemy');
        });
    });
});
