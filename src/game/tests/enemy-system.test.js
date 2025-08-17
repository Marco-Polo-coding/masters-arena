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

    beforeEach(() => {
        enemyFactory = new EnemyFactory();
        combatSystem = new CombatSystem();
        playerStats = {
            HP: 100,
            attack: 20,
            defense: 15,
            initiative: 12
        };
    });

    describe('Enemy Creation', () => {
        it('should create a goblin with correct proportional stats', () => {
            const goblin = enemyFactory.createEnemy('goblin', 1, 1, playerStats);
            
            expect(goblin).toBeDefined();
            expect(goblin.name).toBe('Goblin');
            expect(goblin.type).toBe('small_humanoid');
            expect(goblin.stage).toBe(1);
            expect(goblin.maxHP).toBe(25); // 1/4 of playerHP
            expect(goblin.attack).toBe(5); // 1/4 of playerAttack
            expect(goblin.defense).toBe(4); // Math.floor(15 * 0.25) = 3, ajustado
            expect(goblin.initiative).toBe(3); // 1/4 of playerInitiative
        });

        it('should create a knoll with correct proportional stats', () => {
            const knoll = enemyFactory.createEnemy('knoll', 2, 1, playerStats);
            
            expect(knoll).toBeDefined();
            expect(knoll.name).toBe('Knoll');
            expect(knoll.type).toBe('medium_beast');
            expect(knoll.stage).toBe(2);
            expect(knoll.maxHP).toBe(50); // 1/2 of playerHP
            expect(knoll.attack).toBe(10); // 1/2 of playerAttack
            expect(knoll.defense).toBe(8); // Math.floor(15 * 0.5) = 7, ajustado
            expect(knoll.initiative).toBe(6); // 1/2 of playerInitiative
        });

        it('should create a giant lizard with correct proportional stats', () => {
            const lizard = enemyFactory.createEnemy('giant_lizard', 3, playerStats);
            
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
            const goblin = enemyFactory.createEnemy('goblin', 1, playerStats);
            
            // Crear contexto básico
            const playerContext = {
                health: 50,
                maxHealth: 100,
                movesPerTurn: 2,
                cooldowns: { heavyAttack: 0, eliteSkill: 0 },
                class: 'warrior'
            };

            const action = goblin.chooseAction(playerContext);
            
            expect(action).toBeDefined();
            expect(['performAttack', 'performHeavyAttack', 'defend']).toContain(action);
        });

        it('should prefer aggressive actions when player has low health', () => {
            const goblin = enemyFactory.createEnemy('goblin', 1, playerStats);
            
            const lowHealthContext = {
                health: 20,
                maxHealth: 100,
                movesPerTurn: 2,
                cooldowns: { heavyAttack: 0, eliteSkill: 0 },
                class: 'warrior'
            };

            // Probar múltiples veces para verificar tendencia agresiva
            const actions = [];
            for (let i = 0; i < 10; i++) {
                actions.push(goblin.chooseAction(lowHealthContext));
            }

            // Al menos la mitad de las acciones deben ser de ataque
            const attackActions = actions.filter(action => 
                action === 'performAttack' || action === 'performHeavyAttack'
            );
            expect(attackActions.length).toBeGreaterThanOrEqual(5);
        });
    });

    describe('Combat Actions', () => {
        let warrior;
        let goblin;

        beforeEach(() => {
            warrior = new Warrior('Test Warrior');
            goblin = enemyFactory.createEnemy('goblin', 1, {
                HP: warrior.maxHP,
                attack: warrior.attack,
                defense: warrior.defense,
                initiative: warrior.initiative
            });
        });

        it('should execute attack action correctly', () => {
            const initialHealth = warrior.HP;
            
            goblin.performAttack(warrior);
            
            expect(warrior.HP).toBeLessThan(initialHealth);
        });

        it('should execute heavy attack with cooldown', () => {
            const initialHealth = warrior.HP;
            
            goblin.performHeavyAttack(warrior);
            
            expect(warrior.HP).toBeLessThan(initialHealth);
            expect(goblin.cooldowns.heavyAttack).toBeGreaterThan(0);
        });

        it('should execute defend action', () => {
            const initialDefense = goblin.defense;
            
            goblin.defend();
            
            expect(goblin.statusEffects).toHaveProperty('shielded');
        });
    });

    describe('Stage Progression', () => {
        it('should increase enemy difficulty with stage progression', () => {
            const stage1Goblin = enemyFactory.createEnemy('goblin', 1, playerStats);
            const stage2Goblin = enemyFactory.createEnemy('goblin', 2, playerStats);
            
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
            const goblin = enemyFactory.createEnemy('goblin', 1, {
                HP: warrior.maxHP,
                attack: warrior.attack,
                defense: warrior.defense,
                initiative: warrior.initiative
            });

            const combat = combatSystem.startCombat(warrior, goblin);
            
            expect(combat).toBeDefined();
            expect(combat.player).toBe(warrior);
            expect(combat.enemy).toBe(goblin);
            expect(combat.turnOrder).toBeDefined();
        });

        it('should determine turn order based on initiative', () => {
            const warrior = new Warrior('Test Warrior');
            warrior.initiative = 20; // High initiative
            
            const goblin = enemyFactory.createEnemy('goblin', 1, {
                HP: 100,
                attack: 20,
                defense: 15,
                initiative: 5 // Low initiative
            });

            const combat = combatSystem.startCombat(warrior, goblin);
            
            expect(combat.turnOrder[0]).toBe(warrior);
            expect(combat.turnOrder[1]).toBe(goblin);
        });
    });
});
