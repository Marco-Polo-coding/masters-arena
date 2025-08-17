/**
 * BaseEnemy.js - Clase base para todos los enemigos del juego
 * Sistema de stats proporcionales según tipo de enemigo y nivel del jugador
 * AI con contexto del jugador y perfiles de dificultad
 */

class BaseEnemy {
    constructor(type, stage, playerLevel, playerStats, profile = 'normal') {
        this.type = type; // 'small_humanoid', 'medium_beast', 'large_beast', 'gladiator'
        this.stage = stage; // 1, 2, 3
        this.profile = profile; // 'normal', 'aggressive'
        this.playerLevel = playerLevel;
        this.playerStats = playerStats;

        // Configurar stats base según tipo de enemigo
        this.setupEnemyStats();
        
        // Sistema de cooldowns y estado
        this.cooldowns = {};
        this.statusEffects = {};
        this.turnCount = 0;
        
        // Estado de combate
        this.currentHP = this.maxHP;
        this.isAlive = true;
        this.lastAction = null;
        
        // Configurar recompensas
        this.setupRewards();
    }

    setupEnemyStats() {
        const playerHP = this.playerStats.maxHP || this.playerStats.HP;
        const playerAttack = this.playerStats.attack;
        const playerDefense = this.playerStats.defense;
        const playerInitiative = this.playerStats.initiative;

        // Proporciones según tipo de enemigo
        const statMultipliers = {
            small_humanoid: {
                hp: 0.25,    // 1/4 de las stats del player
                attack: 0.25,
                defense: 0.25,
                initiative: 0.25
            },
            medium_beast: {
                hp: 0.5,     // 2/4 de las stats del player
                attack: 0.5,
                defense: 0.5,
                initiative: 0.5
            },
            large_beast: {
                hp: 1.2,     // Más vida que el player pero 3/4 de otras stats
                attack: 0.75,
                defense: 0.75,
                initiative: 0.75
            },
            gladiator: {
                hp: 1.0,     // Stats similares al player
                attack: 1.0,
                defense: 1.0,
                initiative: 1.0
            }
        };

        const multiplier = statMultipliers[this.type];
        
        this.maxHP = Math.floor(playerHP * multiplier.hp);
        this.attack = Math.floor(playerAttack * multiplier.attack);
        this.defense = Math.floor(playerDefense * multiplier.defense);
        this.initiative = Math.floor(playerInitiative * multiplier.initiative);

        // Ajustes por perfil de dificultad
        if (this.profile === 'aggressive') {
            this.attack = Math.floor(this.attack * 1.2);
            this.initiative = Math.floor(this.initiative * 1.1);
        }
    }

    setupRewards() {
        // Sistema de oro según tipo y stage
        const goldRewards = {
            small_humanoid: { 1: 10, 2: 20, 3: 30 },
            medium_beast: { 1: 20, 2: 40, 3: 80 },
            large_beast: { 1: 30, 2: 60, 3: 90 },
            gladiator: { 1: 50, 2: 100, 3: null } // Stage 3 es final del juego
        };

        this.goldReward = goldRewards[this.type][this.stage];

        // XP base (puede ser modificado por subclases)
        const xpBase = {
            small_humanoid: 25,
            medium_beast: 50,
            large_beast: 75,
            gladiator: 150
        };

        this.xpReward = xpBase[this.type] * this.stage;
    }

    // AI Decision Making System
    chooseAction(playerContext) {
        const { hp, maxHP, currentClass, cooldowns, statusEffects } = playerContext;
        const playerHPRatio = hp / maxHP;
        
        // Factores de decisión de la AI
        const aiContext = {
            playerLowHealth: playerHPRatio < 0.25,
            playerHeavyOnCooldown: cooldowns.heavyAttack > 0,
            playerDefendOnCooldown: cooldowns.defend > 0,
            playerEliteOnCooldown: cooldowns.elite > 0,
            playerHasStatusEffects: Object.keys(statusEffects).length > 0,
            enemyLowHealth: this.currentHP / this.maxHP < 0.3,
            enemyHealthy: this.currentHP / this.maxHP > 0.7
        };

        // Comportamiento específico según clase del jugador
        const classCounters = this.getClassCounterStrategy(currentClass, aiContext);
        
        // Decidir acción basada en contexto
        return this.selectOptimalAction(aiContext, classCounters);
    }

    getClassCounterStrategy(playerClass, context) {
        const strategies = {
            Warrior: {
                // Warrior es susceptible a status effects
                preferStatusEffects: true,
                avoidDirectConfrontation: context.enemyLowHealth,
                targetWeakness: 'status_effects'
            },
            Rogue: {
                // Rogue es squishy y susceptible a limitación de movilidad
                preferDirectDamage: true,
                prioritizeControl: true,
                targetWeakness: 'mobility_control'
            },
            Mage: {
                // Mage es susceptible a interrupciones y daño directo
                preferInterruption: true,
                prioritizeAggression: true,
                targetWeakness: 'spell_interruption'
            }
        };

        return strategies[playerClass] || {};
    }

    selectOptimalAction(context, classStrategy) {
        const actions = this.getAvailableActions();
        let actionPriorities = {};

        // Evaluar cada acción disponible
        actions.forEach(action => {
            actionPriorities[action] = this.evaluateActionPriority(action, context, classStrategy);
        });

        // Seleccionar la acción con mayor prioridad
        const bestAction = Object.keys(actionPriorities).reduce((a, b) => 
            actionPriorities[a] > actionPriorities[b] ? a : b
        );

        return bestAction;
    }

    evaluateActionPriority(action, context, classStrategy) {
        let priority = 0;

        // Prioridades base según contexto
        if (context.playerLowHealth && action === 'performAttack') priority += 30;
        if (context.enemyLowHealth && action === 'defend') priority += 25;
        if (context.playerHeavyOnCooldown && action === 'performHeavyAttack') priority += 20;

        // Ajustes según estrategia de clase
        if (classStrategy.preferStatusEffects && action.includes('status')) priority += 25;
        if (classStrategy.preferDirectDamage && action === 'performHeavyAttack') priority += 20;
        if (classStrategy.prioritizeAggression && action === 'performAttack') priority += 15;

        // Perfil de dificultad
        if (this.profile === 'aggressive') {
            if (action === 'performAttack' || action === 'performHeavyAttack') priority += 10;
            if (action === 'defend') priority -= 15;
        }

        return priority + Math.random() * 10; // Factor aleatorio para variabilidad
    }

    getAvailableActions() {
        // Acciones base disponibles para todos los enemigos
        let actions = ['performAttack', 'defend'];
        
        // Añadir acciones especiales si no están en cooldown
        if (!this.cooldowns.heavyAttack) actions.push('performHeavyAttack');
        
        return actions;
    }

    // Acciones de combate base
    performAttack(target) {
        const damage = this.calculateDamage(this.attack);
        this.lastAction = 'attack';
        
        // Aplicar daño al objetivo
        if (target && target.takeDamage) {
            target.takeDamage(damage, 'enemy_attack');
        }
        
        return {
            action: 'attack',
            damage: damage,
            success: true,
            message: `${this.name} attacks for ${damage} damage!`
        };
    }

    performHeavyAttack(target) {
        if (this.cooldowns.heavyAttack > 0) {
            return { success: false, message: "Heavy attack is on cooldown!" };
        }

        const damage = this.calculateDamage(this.attack * 2);
        this.cooldowns.heavyAttack = 2; // Cooldown de 2 turnos
        this.lastAction = 'heavy_attack';
        
        // Aplicar daño al objetivo
        if (target && target.takeDamage) {
            target.takeDamage(damage, 'enemy_heavy_attack');
        }
        
        return {
            action: 'heavy_attack',
            damage: damage,
            success: true,
            message: `${this.name} performs a heavy attack for ${damage} damage!`
        };
    }

    defend() {
        this.applyStatusEffect('shielded', 1, 'self');
        this.lastAction = 'defend';
        return {
            action: 'defend',
            mitigation: Math.floor(this.defense * 0.5),
            success: true,
            message: `${this.name} takes a defensive stance!`
        };
    }

    calculateDamage(baseDamage) {
        // Variabilidad de daño ±20%
        const variance = 0.2;
        const minDamage = Math.floor(baseDamage * (1 - variance));
        const maxDamage = Math.floor(baseDamage * (1 + variance));
        return Math.floor(Math.random() * (maxDamage - minDamage + 1)) + minDamage;
    }

    takeDamage(amount, source = 'unknown') {
        let finalDamage = amount;
        
        // Aplicar defensa si está en postura defensiva
        if (this.lastAction === 'defend') {
            const mitigation = Math.floor(this.defenseStat * 0.5);
            finalDamage = Math.max(1, amount - mitigation);
        }

        this.currentHP = Math.max(0, this.currentHP - finalDamage);
        
        if (this.currentHP <= 0) {
            this.isAlive = false;
        }

        return {
            damageTaken: finalDamage,
            currentHP: this.currentHP,
            isAlive: this.isAlive
        };
    }

    // Sistema de status effects (básico para enemigos)
    applyStatusEffect(effect, duration, source) {
        this.statusEffects[effect] = {
            duration: duration,
            source: source,
            appliedTurn: this.turnCount
        };
    }

    processStatusEffects() {
        const effects = [];
        
        Object.keys(this.statusEffects).forEach(effectName => {
            const effect = this.statusEffects[effectName];
            const result = this.processStatusEffect(effectName, effect);
            if (result) effects.push(result);
            
            // Reducir duración
            effect.duration--;
            if (effect.duration <= 0) {
                delete this.statusEffects[effectName];
            }
        });

        return effects;
    }

    processStatusEffect(effectName, effect) {
        // Procesar efectos básicos
        switch(effectName) {
            case 'bleed':
                const bleedDamage = Math.floor(this.maxHP * 0.05); // 5% HP max
                this.takeDamage(bleedDamage, 'bleed');
                return { effect: 'bleed', damage: bleedDamage };
            
            case 'burn':
                const burnDamage = Math.floor(this.attackStat * 0.3);
                this.takeDamage(burnDamage, 'burn');
                return { effect: 'burn', damage: burnDamage };
            
            default:
                return null;
        }
    }

    // Gestión de turnos
    startTurn() {
        this.turnCount++;
        
        // Procesar cooldowns
        Object.keys(this.cooldowns).forEach(ability => {
            if (this.cooldowns[ability] > 0) {
                this.cooldowns[ability]--;
            }
        });

        // Procesar status effects
        return this.processStatusEffects();
    }

    // Información para UI
    getDisplayInfo() {
        return {
            name: this.name,
            type: this.type,
            stage: this.stage,
            profile: this.profile,
            currentHP: this.currentHP,
            maxHP: this.maxHP,
            attack: this.attackStat,
            defense: this.defenseStat,
            initiative: this.initiativeStat,
            statusEffects: this.statusEffects,
            cooldowns: this.cooldowns,
            isAlive: this.isAlive
        };
    }

    // Recompensas al derrotar al enemigo
    getRewards() {
        return {
            gold: this.goldReward,
            xp: this.xpReward
        };
    }
}

export default BaseEnemy;
