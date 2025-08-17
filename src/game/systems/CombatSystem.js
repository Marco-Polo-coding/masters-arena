/**
 * CombatSystem.js - Sistema de combate entre jugador y enemigos
 * Maneja turnos, iniciativa, acciones y resolución de combate
 */

class CombatSystem {
    constructor() {
        this.combatState = 'inactive'; // 'inactive', 'active', 'player_turn', 'enemy_turn', 'ended'
        this.player = null;
        this.enemy = null;
        this.turnOrder = [];
        this.currentTurnIndex = 0;
        this.turnCount = 0;
        this.combatLog = [];
        this.combatResult = null;
    }

    /**
     * Inicia un combate entre jugador y enemigo
     * @param {BaseClass} player - Instancia del jugador
     * @param {BaseEnemy} enemy - Instancia del enemigo
     * @returns {Object} Estado inicial del combate
     */
    startCombat(player, enemy) {
        this.player = player;
        this.enemy = enemy;
        this.combatState = 'active';
        this.turnCount = 0;
        this.combatLog = [];
        this.combatResult = null;

        // Determinar orden de turnos basado en initiative
        this.determineTurnOrder();

        // Log inicial
        this.addToLog('COMBAT_START', `Combat begins! ${player.name} vs ${enemy.name}`);
        this.addToLog('TURN_ORDER', `Turn order: ${this.turnOrder.map(t => t.name).join(' → ')}`);
        
        // Flavor text inicial si el enemigo lo tiene
        if (enemy.getFlavorText) {
            this.addToLog('FLAVOR', enemy.getFlavorText());
        }

        // Dialogue inicial para gladiators
        if (enemy.getBattleDialogue) {
            this.addToLog('DIALOGUE', enemy.getBattleDialogue());
        }

        // Comenzar primer turno
        this.startNextTurn();

        return this.getCombatStatus();
    }

    /**
     * Determina el orden de turnos basado en initiative
     */
    determineTurnOrder() {
        const combatants = [
            { entity: this.player, name: this.player.name, initiative: this.player.initiative, type: 'player' },
            { entity: this.enemy, name: this.enemy.name, initiative: this.enemy.initiative, type: 'enemy' }
        ];

        // Ordenar por initiative (mayor primero)
        combatants.sort((a, b) => {
            if (b.initiative === a.initiative) {
                // En caso de empate, aleatorio
                return Math.random() - 0.5;
            }
            return b.initiative - a.initiative;
        });

        this.turnOrder = combatants;
        this.currentTurnIndex = 0;
    }

    /**
     * Inicia el siguiente turno
     */
    startNextTurn() {
        if (this.combatState === 'ended') return;

        const currentCombatant = this.turnOrder[this.currentTurnIndex];
        
        if (currentCombatant.type === 'player') {
            this.combatState = 'player_turn';
            this.startPlayerTurn();
        } else {
            this.combatState = 'enemy_turn';
            this.startEnemyTurn();
        }
    }

    /**
     * Inicia el turno del jugador
     */
    startPlayerTurn() {
        this.turnCount++;
        this.addToLog('TURN_START', `--- Turn ${this.turnCount}: ${this.player.name}'s turn ---`);

        // Procesar efectos de inicio de turno del jugador
        const playerTurnEffects = this.player.startTurn();
        this.processStatusEffects(playerTurnEffects, this.player, 'player');

        // El jugador ahora puede elegir su acción
        // En un juego real, aquí se esperaría input del jugador
        // Para testing, podemos simular acciones
    }

    /**
     * Inicia el turno del enemigo
     */
    startEnemyTurn() {
        if (!this.enemy.isAlive) {
            this.endCombat('victory');
            return;
        }

        this.addToLog('TURN_START', `--- ${this.enemy.name}'s turn ---`);

        // Procesar efectos de inicio de turno del enemigo
        const enemyTurnEffects = this.enemy.startTurn();
        this.processStatusEffects(enemyTurnEffects, this.enemy, 'enemy');

        // Check por modos especiales (frenzy, berserker, etc.)
        if (enemyTurnEffects.frenzy && enemyTurnEffects.frenzy.triggered) {
            this.addToLog('SPECIAL', enemyTurnEffects.frenzy.message);
        }
        if (enemyTurnEffects.berserker && enemyTurnEffects.berserker.triggered) {
            this.addToLog('SPECIAL', enemyTurnEffects.berserker.message);
        }

        // La AI elige su acción
        const playerContext = this.getPlayerContext();
        const chosenAction = this.enemy.chooseAction(playerContext);
        
        // Ejecutar la acción del enemigo
        setTimeout(() => {
            this.executeEnemyAction(chosenAction);
        }, 500); // Pequeño delay para simular "thinking time"
    }

    /**
     * Obtiene el contexto del jugador para la AI del enemigo
     */
    getPlayerContext() {
        return {
            hp: this.player.currentHP,
            maxHP: this.player.maxHP,
            currentClass: this.player.constructor.name,
            cooldowns: { ...this.player.cooldowns },
            statusEffects: { ...this.player.statusEffects },
            lastAction: this.player.lastAction,
            level: this.player.level
        };
    }

    /**
     * Ejecuta una acción del jugador
     * @param {string} action - Acción a ejecutar
     * @param {Object} params - Parámetros adicionales para la acción
     */
    executePlayerAction(action, params = {}) {
        if (this.combatState !== 'player_turn') {
            return { success: false, message: "Not player's turn!" };
        }

        let result;
        const target = this.enemy;

        // Ejecutar la acción según el tipo
        switch (action) {
            case 'attack':
                result = this.player.lightAttack(target);
                break;
            case 'heavy_attack':
                result = this.player.heavyAttack(target);
                break;
            case 'defend':
                result = this.player.defend();
                break;
            case 'heal':
                result = this.player.heal();
                break;
            case 'elite':
                result = this.player.eliteSkill(target, this.getPlayerContext());
                break;
            default:
                return { success: false, message: `Unknown action: ${action}` };
        }

        if (result.success) {
            this.addToLog('PLAYER_ACTION', result.message);

            // Aplicar daño al enemigo si corresponde
            if (result.damage > 0) {
                const damageResult = this.enemy.takeDamage(result.damage, action, this.player);
                this.addToLog('DAMAGE', `${this.enemy.name} takes ${damageResult.damageTaken} damage! (${damageResult.currentHP}/${this.enemy.maxHP} HP)`);
                
                // Efectos especiales de daño (reflection, armor, etc.)
                if (damageResult.reflectedDamage > 0) {
                    const reflectResult = this.player.takeDamage(damageResult.reflectedDamage, 'reflection');
                    this.addToLog('REFLECTION', `${this.player.name} takes ${reflectResult.damageTaken} reflected damage!`);
                }
            }

            // Aplicar status effects si corresponde
            if (result.statusEffect) {
                this.enemy.applyStatusEffect(
                    result.statusEffect.type, 
                    result.statusEffect.duration, 
                    result.statusEffect.source
                );
                this.addToLog('STATUS_EFFECT', `${this.enemy.name} is affected by ${result.statusEffect.type}!`);
            }

            // Reacción del enemigo si está disponible
            if (this.enemy.reactToPlayerAction) {
                const reaction = this.enemy.reactToPlayerAction(action);
                if (reaction) {
                    this.addToLog('ENEMY_REACTION', reaction);
                }
            }

            // Verificar si el enemigo murió
            if (!this.enemy.isAlive) {
                this.endCombat('victory');
                return result;
            }

            // Finalizar turno del jugador
            this.endPlayerTurn();
        } else {
            this.addToLog('FAILED_ACTION', result.message);
        }

        return result;
    }

    /**
     * Ejecuta una acción del enemigo
     * @param {string} action - Acción elegida por la AI
     */
    executeEnemyAction(action) {
        let result;
        const target = this.player;
        const targetContext = this.getPlayerContext();

        // Ejecutar la acción según el tipo
        switch (action) {
            case 'attack':
                result = this.enemy.attack ? this.enemy.attack(target) : { success: false, message: "Attack failed" };
                break;
            case 'heavy_attack':
                result = this.enemy.heavyAttack ? this.enemy.heavyAttack(target) : { success: false, message: "Heavy attack failed" };
                break;
            case 'defend':
                result = this.enemy.defend ? this.enemy.defend() : { success: false, message: "Defend failed" };
                break;
            // Acciones específicas de enemigos
            case 'poisoned_blade':
                result = this.enemy.poisonedBlade ? this.enemy.poisonedBlade(target) : this.enemy.attack(target);
                break;
            case 'dirty_fighting':
                result = this.enemy.dirtyFighting ? this.enemy.dirtyFighting(target) : this.enemy.defend();
                break;
            case 'savage_bite':
                result = this.enemy.savageBite ? this.enemy.savageBite(target) : this.enemy.attack(target);
                break;
            case 'howl':
                result = this.enemy.howl ? this.enemy.howl(target) : this.enemy.defend();
                break;
            case 'pack_tactics':
                result = this.enemy.packTactics ? this.enemy.packTactics(target, targetContext) : this.enemy.attack(target);
                break;
            case 'tail_whip':
                result = this.enemy.tailWhip ? this.enemy.tailWhip(target) : this.enemy.attack(target);
                break;
            case 'venom_spit':
                result = this.enemy.venomSpit ? this.enemy.venomSpit(target) : this.enemy.attack(target);
                break;
            case 'scale_hardening':
                result = this.enemy.scaleHardening ? this.enemy.scaleHardening(target) : this.enemy.defend();
                break;
            case 'crushing_bite':
                result = this.enemy.crushingBite ? this.enemy.crushingBite(target) : this.enemy.attack(target);
                break;
            // Acciones de gladiator
            case 'iron_guard':
                result = this.enemy.ironGuard ? this.enemy.ironGuard(target) : this.enemy.defend();
                break;
            case 'battle_endurance':
                result = this.enemy.battleEndurance ? this.enemy.battleEndurance(target) : this.enemy.defend();
                break;
            case 'execution_strike':
                result = this.enemy.executionStrike ? this.enemy.executionStrike(target, targetContext) : this.enemy.attack(target);
                break;
            case 'warrior_shout':
                result = this.enemy.warriorShout ? this.enemy.warriorShout(target) : this.enemy.defend();
                break;
            default:
                result = this.enemy.attack(target); // Fallback
        }

        if (result.success) {
            this.addToLog('ENEMY_ACTION', result.message);

            // Aplicar daño al jugador si corresponde
            if (result.damage > 0) {
                const damageResult = this.player.takeDamage(result.damage, action, this.enemy);
                this.addToLog('DAMAGE', `${this.player.name} takes ${damageResult.damageTaken} damage! (${damageResult.currentHP}/${this.player.maxHP} HP)`);
            }

            // Aplicar status effects si corresponde
            if (result.statusEffect) {
                this.player.applyStatusEffect(
                    result.statusEffect.type, 
                    result.statusEffect.duration, 
                    result.statusEffect.source
                );
                this.addToLog('STATUS_EFFECT', `${this.player.name} is affected by ${result.statusEffect.type}!`);
            }

            // Verificar si el jugador murió
            if (!this.player.isAlive) {
                this.endCombat('defeat');
                return;
            }

            // Finalizar turno del enemigo
            this.endEnemyTurn();
        } else {
            this.addToLog('FAILED_ACTION', result.message);
            this.endEnemyTurn(); // Even failed actions end the turn
        }
    }

    /**
     * Procesa los efectos de status al inicio de turno
     */
    processStatusEffects(effects, entity, type) {
        if (!effects || (Array.isArray(effects) && effects.length === 0)) return;

        if (Array.isArray(effects)) {
            effects.forEach(effect => {
                if (effect.damage > 0) {
                    this.addToLog('STATUS_DAMAGE', `${entity.name} takes ${effect.damage} damage from ${effect.effect}!`);
                }
                if (effect.healing > 0) {
                    this.addToLog('STATUS_HEAL', `${entity.name} heals ${effect.healing} HP from ${effect.effect}!`);
                }
            });
        }

        // Procesar efectos especiales (solo para testing/logging)
        if (effects.statusEffects) {
            this.processStatusEffects(effects.statusEffects, entity, type);
        }
    }

    /**
     * Finaliza el turno del jugador
     */
    endPlayerTurn() {
        this.currentTurnIndex = (this.currentTurnIndex + 1) % this.turnOrder.length;
        this.startNextTurn();
    }

    /**
     * Finaliza el turno del enemigo
     */
    endEnemyTurn() {
        this.currentTurnIndex = (this.currentTurnIndex + 1) % this.turnOrder.length;
        this.startNextTurn();
    }

    /**
     * Finaliza el combate
     * @param {string} result - Resultado del combate ('victory', 'defeat', 'draw')
     */
    endCombat(result) {
        this.combatState = 'ended';
        this.combatResult = result;

        if (result === 'victory') {
            const rewards = this.enemy.getRewards();
            this.addToLog('COMBAT_END', `Victory! ${this.enemy.name} has been defeated!`);
            this.addToLog('REWARDS', `Rewards: ${rewards.gold} gold, ${rewards.xp} XP`);
            
            if (rewards.bonusXP) {
                this.addToLog('BONUS_REWARDS', `Bonus XP: ${rewards.bonusXP}`);
            }
            
            if (rewards.uniqueLoot) {
                this.addToLog('UNIQUE_LOOT', `Unique item found: ${rewards.uniqueLoot}`);
            }

            // Dialogue de derrota para gladiators
            if (this.enemy.getBattleDialogue) {
                this.addToLog('DEFEAT_DIALOGUE', this.enemy.getBattleDialogue());
            }

        } else if (result === 'defeat') {
            this.addToLog('COMBAT_END', `Defeat! ${this.player.name} has fallen in battle.`);
            
            // Mensaje de aliento
            this.addToLog('ENCOURAGEMENT', "Don't give up! Learn from this defeat and come back stronger!");
        }
    }

    /**
     * Añade una entrada al log de combate
     * @param {string} type - Tipo de mensaje
     * @param {string} message - Mensaje a añadir
     */
    addToLog(type, message) {
        this.combatLog.push({
            turn: this.turnCount,
            type: type,
            message: message,
            timestamp: Date.now()
        });
    }

    /**
     * Obtiene el estado actual del combate
     * @returns {Object} Estado completo del combate
     */
    getCombatStatus() {
        return {
            state: this.combatState,
            turnCount: this.turnCount,
            currentTurn: this.combatState.includes('turn') ? this.turnOrder[this.currentTurnIndex] : null,
            player: this.player ? {
                name: this.player.name,
                hp: this.player.currentHP,
                maxHP: this.player.maxHP,
                statusEffects: this.player.statusEffects,
                cooldowns: this.player.cooldowns,
                isAlive: this.player.isAlive
            } : null,
            enemy: this.enemy ? {
                name: this.enemy.name,
                hp: this.enemy.currentHP,
                maxHP: this.enemy.maxHP,
                statusEffects: this.enemy.statusEffects,
                cooldowns: this.enemy.cooldowns,
                isAlive: this.enemy.isAlive
            } : null,
            log: this.combatLog,
            result: this.combatResult
        };
    }

    /**
     * Obtiene las acciones disponibles para el jugador
     * @returns {Array} Lista de acciones disponibles
     */
    getPlayerAvailableActions() {
        if (!this.player || this.combatState !== 'player_turn') {
            return [];
        }

        const actions = [];

        // Acciones básicas
        actions.push({ action: 'attack', name: 'Light Attack', description: 'Basic attack' });
        
        if (this.player.cooldowns.heavy <= 0) {
            actions.push({ action: 'heavy_attack', name: 'Heavy Attack', description: '2x damage, 2 turn cooldown' });
        }

        if (this.player.cooldowns.heal <= 0) {
            actions.push({ action: 'defend', name: 'Defend', description: 'Reduce incoming damage' });
        }

        if (this.player.cooldowns.heal <= 0) {
            actions.push({ action: 'heal', name: 'Heal', description: 'Restore HP' });
        }

        if (this.player.cooldowns.elite <= 0) {
            const eliteDescription = this.player.getEliteSkillDescription ? 
                this.player.getEliteSkillDescription() : 'Elite Skill';
            actions.push({ action: 'elite', name: 'Elite Skill', description: eliteDescription });
        }

        return actions;
    }

    /**
     * Simula un combate automático para testing
     * @param {number} maxTurns - Máximo número de turnos antes de empate
     * @returns {Object} Resultado del combate simulado
     */
    simulateCombat(maxTurns = 20) {
        const playerActions = ['attack', 'heavy_attack', 'defend', 'heal', 'elite'];
        
        while (this.combatState === 'active' || this.combatState.includes('turn')) {
            if (this.turnCount > maxTurns) {
                this.endCombat('draw');
                break;
            }

            if (this.combatState === 'player_turn') {
                // Simular acción aleatoria del jugador
                const availableActions = this.getPlayerAvailableActions();
                if (availableActions.length > 0) {
                    const randomAction = availableActions[Math.floor(Math.random() * availableActions.length)];
                    this.executePlayerAction(randomAction.action);
                }
            }
            
            // El turno del enemigo se maneja automáticamente
            // Solo necesitamos esperar a que termine
            if (this.combatState === 'ended') break;
        }

        return this.getCombatStatus();
    }
}

export default CombatSystem;
