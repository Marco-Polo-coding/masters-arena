/**
 * EnemySystemTest.js - Tests para el sistema de enemigos y combate
 * Prueba las mecánicas de enemigos, AI, stats proporcionales y combate
 */

import EnemyFactory from '../systems/EnemyFactory.js';
import CombatSystem from '../systems/CombatSystem.js';
import Warrior from '../classes/Warrior.js';
import Rogue from '../classes/Rogue.js';
import Mage from '../classes/Mage.js';

class EnemySystemTest {
    constructor() {
        this.enemyFactory = new EnemyFactory();
        this.combatSystem = new CombatSystem();
        this.testResults = [];
    }

    /**
     * Ejecuta todos los tests del sistema de enemigos
     */
    async runAllTests() {
        console.log('🧪 Starting Enemy System Tests...\n');

        // Test 1: Enemy Creation and Stats
        await this.testEnemyCreation();
        
        // Test 2: Enemy AI Decision Making
        await this.testEnemyAI();
        
        // Test 3: Combat System Integration
        await this.testCombatSystem();
        
        // Test 4: Enemy Abilities
        await this.testEnemyAbilities();
        
        // Test 5: Stage Progression
        await this.testStageProgression();

        // Mostrar resultados
        this.displayResults();
        
        return this.testResults;
    }

    /**
     * Test 1: Creación de enemigos y validación de stats
     */
    async testEnemyCreation() {
        console.log('📊 Testing Enemy Creation and Stats Validation...');
        
        const testLevels = [1, 2, 3, 4, 5];
        
        for (const level of testLevels) {
            const playerStats = this.enemyFactory.getTestPlayerStats(level);
            
            // Probar cada tipo de enemigo
            const enemyTypes = ['goblin', 'knoll', 'giant_lizard', 'gladiator_warrior'];
            
            for (const enemyType of enemyTypes) {
                try {
                    // Test normal profile
                    const normalEnemy = this.enemyFactory.createEnemy(enemyType, 1, level, playerStats, 'normal');
                    const validation = this.enemyFactory.validateEnemyStats(normalEnemy, playerStats);
                    
                    this.testResults.push({
                        test: 'Enemy Creation',
                        level: level,
                        enemyType: enemyType,
                        profile: 'normal',
                        success: validation.isValid,
                        details: {
                            expected: validation.expected,
                            actual: validation.actual,
                            enemy: normalEnemy.getDisplayInfo()
                        }
                    });

                    // Test aggressive profile
                    const aggressiveEnemy = this.enemyFactory.createEnemy(enemyType, 1, level, playerStats, 'aggressive');
                    
                    this.testResults.push({
                        test: 'Enemy Creation',
                        level: level,
                        enemyType: enemyType,
                        profile: 'aggressive',
                        success: aggressiveEnemy.attack > normalEnemy.attack, // Should have higher attack
                        details: {
                            normalAttack: normalEnemy.attack,
                            aggressiveAttack: aggressiveEnemy.attack,
                            enemy: aggressiveEnemy.getDisplayInfo()
                        }
                    });

                    console.log(`✓ Level ${level} ${enemyType} (${validation.isValid ? 'VALID' : 'INVALID'} stats)`);
                    
                } catch (error) {
                    console.error(`✗ Failed to create ${enemyType} at level ${level}:`, error.message);
                    
                    this.testResults.push({
                        test: 'Enemy Creation',
                        level: level,
                        enemyType: enemyType,
                        success: false,
                        error: error.message
                    });
                }
            }
        }
    }

    /**
     * Test 2: AI Decision Making
     */
    async testEnemyAI() {
        console.log('\n🤖 Testing Enemy AI Decision Making...');
        
        const playerStats = this.enemyFactory.getTestPlayerStats(3);
        const playerClasses = ['Warrior', 'Rogue', 'Mage'];
        
        for (const playerClass of playerClasses) {
            // Simular diferentes contextos de jugador
            const contexts = [
                {
                    name: 'Healthy Player',
                    context: {
                        hp: 100, maxHP: 120, currentClass: playerClass,
                        cooldowns: {}, statusEffects: {}
                    }
                },
                {
                    name: 'Low Health Player', 
                    context: {
                        hp: 20, maxHP: 120, currentClass: playerClass,
                        cooldowns: {}, statusEffects: {}
                    }
                },
                {
                    name: 'Player with Cooldowns',
                    context: {
                        hp: 80, maxHP: 120, currentClass: playerClass,
                        cooldowns: { heavyAttack: 2, elite: 3 }, statusEffects: {}
                    }
                },
                {
                    name: 'Player with Status Effects',
                    context: {
                        hp: 60, maxHP: 120, currentClass: playerClass,
                        cooldowns: {}, statusEffects: { bleed: { duration: 3 } }
                    }
                }
            ];

            for (const testCase of contexts) {
                // Probar con diferentes tipos de enemigos
                const enemies = [
                    this.enemyFactory.createEnemy('goblin', 2, 3, playerStats),
                    this.enemyFactory.createEnemy('knoll', 2, 3, playerStats),
                    this.enemyFactory.createEnemy('gladiator_warrior', 2, 3, playerStats)
                ];

                for (const enemy of enemies) {
                    const chosenAction = enemy.chooseAction(testCase.context);
                    
                    this.testResults.push({
                        test: 'AI Decision Making',
                        playerClass: playerClass,
                        context: testCase.name,
                        enemyType: enemy.type,
                        enemyName: enemy.name,
                        chosenAction: chosenAction,
                        availableActions: enemy.getAvailableActions(),
                        success: enemy.getAvailableActions().includes(chosenAction)
                    });

                    console.log(`${enemy.name} vs ${playerClass} (${testCase.name}): chose '${chosenAction}'`);
                }
            }
        }
    }

    /**
     * Test 3: Combat System Integration
     */
    async testCombatSystem() {
        console.log('\n⚔️ Testing Combat System Integration...');
        
        const playerClasses = [Warrior, Rogue, Mage];
        const enemyTypes = ['goblin', 'knoll', 'giant_lizard'];
        
        for (const PlayerClass of playerClasses) {
            for (const enemyType of enemyTypes) {
                // Crear jugador y enemigo
                const player = new PlayerClass();
                const playerStats = {
                    maxHP: player.maxHP,
                    attack: player.attack,
                    defense: player.defense,
                    initiative: player.initiative
                };
                
                const enemy = this.enemyFactory.createEnemy(enemyType, 1, 1, playerStats);
                
                // Iniciar combate simulado
                const combatResult = this.combatSystem.startCombat(player, enemy);
                
                // Simular algunos turnos
                let turnCount = 0;
                const maxTurns = 10;
                
                while (this.combatSystem.combatState.includes('turn') && turnCount < maxTurns) {
                    if (this.combatSystem.combatState === 'player_turn') {
                        const actions = this.combatSystem.getPlayerAvailableActions();
                        if (actions.length > 0) {
                            const randomAction = actions[Math.floor(Math.random() * actions.length)];
                            this.combatSystem.executePlayerAction(randomAction.action);
                        }
                    }
                    
                    turnCount++;
                    
                    // Small delay to prevent infinite loops
                    await new Promise(resolve => setTimeout(resolve, 10));
                }
                
                const finalStatus = this.combatSystem.getCombatStatus();
                
                this.testResults.push({
                    test: 'Combat Integration',
                    playerClass: PlayerClass.name,
                    enemyType: enemyType,
                    enemyName: enemy.name,
                    success: finalStatus.state === 'ended' || turnCount < maxTurns,
                    result: finalStatus.result,
                    turns: turnCount,
                    finalPlayerHP: finalStatus.player?.hp || 0,
                    finalEnemyHP: finalStatus.enemy?.hp || 0,
                    logLength: finalStatus.log.length
                });

                console.log(`${PlayerClass.name} vs ${enemy.name}: ${finalStatus.result || 'ongoing'} (${turnCount} turns)`);
                
                // Reset combat system for next test
                this.combatSystem = new CombatSystem();
            }
        }
    }

    /**
     * Test 4: Enemy Abilities
     */
    async testEnemyAbilities() {
        console.log('\n✨ Testing Enemy Abilities...');
        
        const playerStats = this.enemyFactory.getTestPlayerStats(2);
        const mockTarget = { takeDamage: () => ({ damageTaken: 10, currentHP: 50, isAlive: true }) };
        const mockContext = { hp: 60, maxHP: 100 };

        // Test Goblin abilities
        const goblin = this.enemyFactory.createEnemy('goblin', 1, 2, playerStats);
        
        // Test poison blade
        if (goblin.poisonedBlade) {
            const result = goblin.poisonedBlade(mockTarget);
            this.testResults.push({
                test: 'Enemy Abilities',
                enemy: 'Goblin',
                ability: 'Poisoned Blade',
                success: result.success,
                hasDamage: result.damage > 0,
                hasStatusEffect: !!result.statusEffect
            });
            console.log(`Goblin Poisoned Blade: ${result.success ? 'SUCCESS' : 'FAILED'}`);
        }

        // Test Knoll abilities
        const knoll = this.enemyFactory.createEnemy('knoll', 1, 2, playerStats);
        
        if (knoll.savageBite) {
            const result = knoll.savageBite(mockTarget);
            this.testResults.push({
                test: 'Enemy Abilities',
                enemy: 'Knoll',
                ability: 'Savage Bite',
                success: result.success,
                hasDamage: result.damage > 0,
                hasStatusEffect: !!result.statusEffect
            });
            console.log(`Knoll Savage Bite: ${result.success ? 'SUCCESS' : 'FAILED'}`);
        }

        // Test Giant Lizard abilities
        const lizard = this.enemyFactory.createEnemy('giant_lizard', 1, 2, playerStats);
        
        if (lizard.tailWhip) {
            const result = lizard.tailWhip(mockTarget);
            this.testResults.push({
                test: 'Enemy Abilities',
                enemy: 'Giant Lizard',
                ability: 'Tail Whip',
                success: result.success,
                hasDamage: result.damage > 0,
                multiHit: result.hits > 1
            });
            console.log(`Giant Lizard Tail Whip: ${result.success ? 'SUCCESS' : 'FAILED'} (${result.hits || 1} hits)`);
        }

        // Test Gladiator abilities
        const gladiator = this.enemyFactory.createEnemy('gladiator_warrior', 1, 2, playerStats);
        
        if (gladiator.executionStrike) {
            const result = gladiator.executionStrike(mockTarget, mockContext);
            this.testResults.push({
                test: 'Enemy Abilities',
                enemy: 'Gladiator Warrior',
                ability: 'Execution Strike',
                success: result.success,
                hasDamage: result.damage > 0,
                scalingDamage: result.missingHPMultiplier > 1
            });
            console.log(`Gladiator Execution Strike: ${result.success ? 'SUCCESS' : 'FAILED'} (${result.missingHPMultiplier}x multiplier)`);
        }
    }

    /**
     * Test 5: Stage Progression
     */
    async testStageProgression() {
        console.log('\n🎯 Testing Stage Progression System...');
        
        const stages = [1, 2, 3];
        const playerStats = this.enemyFactory.getTestPlayerStats(3);
        
        for (const stage of stages) {
            // Test enemy spawns for each stage
            const stageInfo = this.enemyFactory.getStageEnemyInfo(stage);
            
            this.testResults.push({
                test: 'Stage Progression',
                stage: stage,
                success: stageInfo.totalTypes > 0,
                enemyTypes: stageInfo.totalTypes,
                commonCount: stageInfo.commonEnemies.length,
                uncommonCount: stageInfo.uncommonEnemies.length,
                bossCount: stageInfo.bossEnemies.length
            });

            // Test stage encounter generation
            try {
                const encounters = this.enemyFactory.generateStageEncounters(stage, 3, playerStats, 5);
                
                this.testResults.push({
                    test: 'Stage Encounters',
                    stage: stage,
                    success: encounters.length === 5,
                    encounters: encounters.map(e => ({
                        type: e.encounterType,
                        enemy: e.enemy.name,
                        profile: e.profile
                    }))
                });

                console.log(`Stage ${stage}: ${encounters.length} encounters generated`);
                encounters.forEach((enc, i) => {
                    console.log(`  ${i + 1}. ${enc.enemy.name} (${enc.encounterType}, ${enc.profile})`);
                });

            } catch (error) {
                this.testResults.push({
                    test: 'Stage Encounters',
                    stage: stage,
                    success: false,
                    error: error.message
                });
                console.error(`✗ Stage ${stage} encounter generation failed:`, error.message);
            }

            // Test stage boss creation
            try {
                const boss = this.enemyFactory.createStageBoss(stage, 3, playerStats);
                
                this.testResults.push({
                    test: 'Stage Boss',
                    stage: stage,
                    success: boss.type === 'gladiator',
                    bossName: boss.name,
                    goldReward: boss.goldReward,
                    xpReward: boss.xpReward
                });

                console.log(`Stage ${stage} Boss: ${boss.name} (${boss.goldReward} gold, ${boss.xpReward} XP)`);

            } catch (error) {
                this.testResults.push({
                    test: 'Stage Boss',
                    stage: stage,
                    success: false,
                    error: error.message
                });
                console.error(`✗ Stage ${stage} boss creation failed:`, error.message);
            }
        }
    }

    /**
     * Muestra los resultados de todos los tests
     */
    displayResults() {
        console.log('\n📋 TEST RESULTS SUMMARY:');
        console.log('========================');
        
        const testsByCategory = {};
        let totalTests = 0;
        let passedTests = 0;

        this.testResults.forEach(result => {
            if (!testsByCategory[result.test]) {
                testsByCategory[result.test] = { total: 0, passed: 0, failed: 0 };
            }
            
            testsByCategory[result.test].total++;
            totalTests++;
            
            if (result.success) {
                testsByCategory[result.test].passed++;
                passedTests++;
            } else {
                testsByCategory[result.test].failed++;
            }
        });

        Object.keys(testsByCategory).forEach(category => {
            const stats = testsByCategory[category];
            const percentage = ((stats.passed / stats.total) * 100).toFixed(1);
            console.log(`${category}: ${stats.passed}/${stats.total} (${percentage}%) ✓${stats.passed} ✗${stats.failed}`);
        });

        console.log('------------------------');
        const overallPercentage = ((passedTests / totalTests) * 100).toFixed(1);
        console.log(`OVERALL: ${passedTests}/${totalTests} tests passed (${overallPercentage}%)`);
        
        if (passedTests === totalTests) {
            console.log('🎉 ALL TESTS PASSED! Enemy system is working correctly.');
        } else {
            console.log('⚠️ Some tests failed. Check the detailed results above.');
        }

        return {
            total: totalTests,
            passed: passedTests,
            failed: totalTests - passedTests,
            percentage: overallPercentage,
            categories: testsByCategory
        };
    }

    /**
     * Ejecuta un test de combate rápido para demostración
     */
    async quickCombatDemo() {
        console.log('\n⚡ Quick Combat Demo:');
        console.log('====================');
        
        // Crear jugador Warrior y enemigo Gladiator
        const player = new Warrior();
        const playerStats = {
            maxHP: player.maxHP,
            attack: player.attack,
            defense: player.defense,
            initiative: player.initiative
        };
        
        const enemy = this.enemyFactory.createEnemy('gladiator_warrior', 2, 1, playerStats);
        
        console.log(`🛡️ ${player.name} (Level 1 Warrior)`);
        console.log(`   HP: ${player.currentHP}/${player.maxHP}, ATK: ${player.attack}, DEF: ${player.defense}, INI: ${player.initiative}`);
        
        console.log(`⚔️ ${enemy.name} (Stage 2 Boss)`);
        console.log(`   HP: ${enemy.currentHP}/${enemy.maxHP}, ATK: ${enemy.attack}, DEF: ${enemy.defense}, INI: ${enemy.initiative}`);
        
        // Iniciar combate y simular
        const combatStatus = this.combatSystem.startCombat(player, enemy);
        const simulationResult = this.combatSystem.simulateCombat(15);
        
        console.log(`\n🏁 Combat Result: ${simulationResult.result?.toUpperCase() || 'ONGOING'}`);
        console.log(`📊 Combat lasted ${simulationResult.turnCount} turns`);
        console.log(`💙 Final Player HP: ${simulationResult.player?.hp || 0}/${simulationResult.player?.maxHP || 0}`);
        console.log(`❤️ Final Enemy HP: ${simulationResult.enemy?.hp || 0}/${simulationResult.enemy?.maxHP || 0}`);
        
        // Mostrar algunas entradas del log más interesantes
        console.log('\n📜 Combat Highlights:');
        const interestingLogs = simulationResult.log.filter(entry => 
            ['COMBAT_START', 'DIALOGUE', 'SPECIAL', 'REFLECTION', 'COMBAT_END', 'REWARDS'].includes(entry.type)
        );
        
        interestingLogs.slice(0, 8).forEach(entry => {
            console.log(`   ${entry.type}: ${entry.message}`);
        });
        
        return simulationResult;
    }
}

export default EnemySystemTest;
