/**
 * GladiatorWarrior.js - Gladiator enemy (Boss)
 * Versión enemiga de la clase Warrior con habilidades similares pero distintas
 * Stats similares al jugador, considerado como boss fight
 */

import BaseEnemy from './BaseEnemy.js';

class GladiatorWarrior extends BaseEnemy {
    constructor(stage, playerLevel, playerStats, profile = 'normal') {
        super('gladiator', stage, playerLevel, playerStats, profile);
        
        this.name = `Arena Champion ${this.getGladiatorName()}`;
        this.description = 'A seasoned gladiator warrior with masterful combat techniques';
        this.title = 'The Iron Wall';
        
        // Habilidades específicas del Gladiator Warrior (variantes de las del jugador)
        this.abilities = {
            ironGuard: {
                cooldown: 3,
                description: 'Enhanced blocking that reflects damage',
                variant: 'Improved Block with damage reflection'
            },
            battleEndurance: {
                cooldown: 5,
                description: 'Builds up damage and resistance over time',
                variant: 'Enhanced Endure with different mechanics'
            },
            executionStrike: {
                cooldown: 6,
                description: 'Devastating finishing move that scales with missing enemy HP',
                variant: 'Unique elite ability'
            },
            warriorShout: {
                cooldown: 4,
                description: 'Battle cry that intimidates and buffs self'
            }
        };

        // Añadir cooldowns específicos
        this.cooldowns.ironGuard = 0;
        this.cooldowns.battleEndurance = 0;
        this.cooldowns.executionStrike = 0;
        this.cooldowns.warriorShout = 0;

        // Stacks específicos del Gladiator Warrior
        this.enduranceStacks = 0;
        this.maxEnduranceStacks = 5;
        this.ironGuardActive = false;

        // Gladiator tiene mejor equipment que enemigos normales
        this.gladiatorBonus = {
            attack: Math.floor(this.attack * 0.1),
            defense: Math.floor(this.defense * 0.15),
            hp: Math.floor(this.maxHP * 0.1)
        };

        this.attack += this.gladiatorBonus.attack;
        this.defense += this.gladiatorBonus.defense;
        this.maxHP += this.gladiatorBonus.hp;
        this.currentHP = this.maxHP; // Recalcular HP actual
    }

    getGladiatorName() {
        const names = [
            'Marcus the Defender',
            'Brutus Ironshield',
            'Cassius the Unbreakable',
            'Maximus Guardbreaker',
            'Viktor the Stalwart'
        ];
        return names[Math.floor(Math.random() * names.length)];
    }

    getAvailableActions() {
        let actions = super.getAvailableActions();
        
        // Añadir habilidades específicas si no están en cooldown
        if (this.cooldowns.ironGuard <= 0) {
            actions.push('iron_guard');
        }
        
        if (this.cooldowns.battleEndurance <= 0) {
            actions.push('battle_endurance');
        }

        if (this.cooldowns.executionStrike <= 0) {
            actions.push('execution_strike');
        }

        if (this.cooldowns.warriorShout <= 0) {
            actions.push('warrior_shout');
        }

        return actions;
    }

    evaluateActionPriority(action, context, classStrategy) {
        let priority = super.evaluateActionPriority(action, context, classStrategy);
        
        // Prioridades específicas del Gladiator Warrior
        if (action === 'iron_guard' && context.playerHasHighDamageAttacks) {
            priority += 30; // Usar iron guard contra ataques fuertes
        }
        
        if (action === 'battle_endurance' && this.enduranceStacks < this.maxEnduranceStacks) {
            priority += 25; // Acumular stacks
        }

        if (action === 'execution_strike' && context.playerLowHealth) {
            priority += 40; // Finishing move
        }

        if (action === 'warrior_shout' && context.enemyHealthy) {
            priority += 20; // Buff early in combat
        }

        // Boss behavior: más inteligente en el uso de habilidades
        if (this.profile === 'aggressive') {
            if (action === 'execution_strike') priority += 15;
            if (action === 'heavy_attack') priority += 10;
        }

        return priority;
    }

    // Habilidad específica: Iron Guard (variante mejorada de Block)
    ironGuard(target) {
        if (this.cooldowns.ironGuard > 0) {
            return { success: false, message: "Iron Guard is on cooldown!" };
        }

        this.cooldowns.ironGuard = 3;
        this.ironGuardActive = true;
        this.lastAction = 'iron_guard';

        const mitigation = Math.floor(this.defense * 0.8); // Mejor que defend normal

        return {
            action: 'iron_guard',
            damage: 0,
            mitigation: mitigation,
            reflection: true, // Refleja parte del daño
            buff: {
                type: 'iron_guard',
                duration: 2,
                effect: 'damage_reflection_and_mitigation'
            },
            success: true,
            message: `${this.name} assumes an Iron Guard stance, ready to reflect incoming attacks!`
        };
    }

    // Habilidad específica: Battle Endurance (variante de Endure)
    battleEndurance(target) {
        if (this.cooldowns.battleEndurance > 0) {
            return { success: false, message: "Battle Endurance is on cooldown!" };
        }

        this.cooldowns.battleEndurance = 5;
        this.enduranceStacks = Math.min(this.enduranceStacks + 1, this.maxEnduranceStacks);
        this.lastAction = 'battle_endurance';

        // A diferencia del Endure del jugador, este da resistencia gradual
        const damageBonus = this.enduranceStacks * Math.floor(this.attack * 0.1);
        const resistanceBonus = this.enduranceStacks * Math.floor(this.defense * 0.05);

        return {
            action: 'battle_endurance',
            damage: 0,
            stacks: this.enduranceStacks,
            damageBonus: damageBonus,
            resistanceBonus: resistanceBonus,
            success: true,
            message: `${this.name} builds Battle Endurance (Stack ${this.enduranceStacks}/${this.maxEnduranceStacks})! Attack and resistance increased!`
        };
    }

    // Habilidad específica: Execution Strike (Elite ability única)
    executionStrike(target, targetContext) {
        if (this.cooldowns.executionStrike > 0) {
            return { success: false, message: "Execution Strike is on cooldown!" };
        }

        const targetHPRatio = targetContext.hp / targetContext.maxHP;
        const missingHPMultiplier = 1 + (1 - targetHPRatio) * 2; // Más daño cuanto menos HP tenga el objetivo

        const baseDamage = this.attack * 2;
        const finalDamage = this.calculateDamage(baseDamage * missingHPMultiplier);
        
        this.cooldowns.executionStrike = 6;
        this.lastAction = 'execution_strike';

        return {
            action: 'execution_strike',
            damage: finalDamage,
            missingHPMultiplier: missingHPMultiplier,
            success: true,
            message: `${this.name} performs a devastating Execution Strike for ${finalDamage} damage! (${Math.floor(missingHPMultiplier * 100)}% damage multiplier)`
        };
    }

    // Habilidad específica: Warrior Shout
    warriorShout(target) {
        if (this.cooldowns.warriorShout > 0) {
            return { success: false, message: "Warrior Shout is on cooldown!" };
        }

        this.cooldowns.warriorShout = 4;
        this.lastAction = 'warrior_shout';

        // Buff propio e intimidar al enemigo
        this.applyStatusEffect('battle_fury', 3, 'self');

        return {
            action: 'warrior_shout',
            damage: 0,
            selfBuff: {
                type: 'battle_fury',
                duration: 3,
                attackBonus: Math.floor(this.attack * 0.2),
                initiativeBonus: 5
            },
            enemyDebuff: {
                type: 'intimidated',
                duration: 2,
                accuracyReduction: 0.15
            },
            success: true,
            message: `${this.name} lets out a mighty war cry! You feel intimidated while they surge with battle fury!`
        };
    }

    // Override takeDamage para manejar Iron Guard reflection
    takeDamage(amount, source = 'unknown', attacker = null) {
        let reflectedDamage = 0;
        let finalDamage = amount;
        
        // Iron Guard reflection
        if (this.ironGuardActive && this.statusEffects.iron_guard && attacker) {
            reflectedDamage = Math.floor(amount * 0.3); // Refleja 30% del daño
            const mitigation = Math.floor(this.defense * 0.8);
            finalDamage = Math.max(1, amount - mitigation);
        }
        // Defensa normal
        else if (this.lastAction === 'defend') {
            const mitigation = Math.floor(this.defense * 0.5);
            finalDamage = Math.max(1, amount - mitigation);
        }

        // Aplicar resistencia por endurance stacks
        if (this.enduranceStacks > 0) {
            const resistanceBonus = this.enduranceStacks * Math.floor(this.defense * 0.05);
            finalDamage = Math.max(1, finalDamage - resistanceBonus);
        }

        this.currentHP = Math.max(0, this.currentHP - finalDamage);
        
        if (this.currentHP <= 0) {
            this.isAlive = false;
        }

        return {
            damageTaken: finalDamage,
            reflectedDamage: reflectedDamage,
            enduranceReduction: this.enduranceStacks > 0,
            currentHP: this.currentHP,
            isAlive: this.isAlive
        };
    }

    // Override attack para incluir bonuses de endurance
    attack(target) {
        const enduranceBonus = this.enduranceStacks * Math.floor(this.attack * 0.1);
        const totalAttack = this.attack + enduranceBonus;
        
        const damage = this.calculateDamage(totalAttack);
        this.lastAction = 'attack';
        
        return {
            action: 'attack',
            damage: damage,
            enduranceBonus: enduranceBonus,
            success: true,
            message: `${this.name} attacks for ${damage} damage!${enduranceBonus > 0 ? ` (Enhanced by Battle Endurance +${enduranceBonus})` : ''}`
        };
    }

    // Comportamiento específico del Gladiator Warrior
    getClassCounterStrategy(playerClass, context) {
        const baseStrategy = super.getClassCounterStrategy(playerClass, context);
        
        // El Gladiator Warrior es experto en combate y adapta su estrategia
        switch(playerClass) {
            case 'Warrior':
                return {
                    ...baseStrategy,
                    mirrorMatch: true,
                    useExperience: true, // Tiene más experiencia que el jugador
                    outEndure: true,
                    technicalSuperiority: true
                };
            case 'Rogue':
                return {
                    ...baseStrategy,
                    counterSpeed: true,
                    useReflection: true, // Iron Guard contra daggers
                    overwhelmWithPower: true,
                    denyEvasion: true
                };
            case 'Mage':
                return {
                    ...baseStrategy,
                    rushDown: true,
                    reflectSpells: true, // Iron Guard contra magic
                    intimidate: true, // Warrior Shout
                    closeCombat: true
                };
            default:
                return baseStrategy;
        }
    }

    startTurn() {
        const baseResult = super.startTurn();
        
        // Verificar si Iron Guard sigue activo
        if (!this.statusEffects.iron_guard) {
            this.ironGuardActive = false;
        }
        
        return {
            ...baseResult,
            enduranceStacks: this.enduranceStacks,
            ironGuardActive: this.ironGuardActive
        };
    }

    // Flavor text específico de boss
    getFlavorText() {
        const texts = [
            `${this.name} adjusts their grip on their weapon with practiced ease.`,
            "The gladiator's eyes show the wisdom of countless battles.",
            "Scars of victory mark the champion's weathered armor.",
            "The crowd's cheers echo as the veteran warrior prepares to fight.",
            "Years of arena combat have honed every movement to perfection."
        ];
        
        return texts[Math.floor(Math.random() * texts.length)];
    }

    // Dialogue específico de gladiator
    getBattleDialogue() {
        const phases = {
            intro: [
                "\"Another challenger approaches. Show me what you've learned.\"",
                "\"I've fought warriors like you before. You'll need more than courage.\"",
                "\"The arena will test everything you think you know about combat.\""
            ],
            midBattle: [
                "\"Impressive! But I'm just getting started.\"",
                "\"You fight well, but experience trumps enthusiasm.\"",
                "\"Now you face a true master of the blade!\""
            ],
            lowHealth: [
                "\"You... you're stronger than I expected.\"",
                "\"No... I won't fall to an upstart!\"",
                "\"This isn't over! I still have fight left!\""
            ],
            defeat: [
                "\"Well fought... you have earned this victory.\"",
                "\"The arena... chooses its champions well...\"",
                "\"You fight with honor. I respect that.\""
            ]
        };

        const hpRatio = this.currentHP / this.maxHP;
        
        if (hpRatio < 0.25) return this.randomFromArray(phases.lowHealth);
        if (hpRatio < 0.75) return this.randomFromArray(phases.midBattle);
        return this.randomFromArray(phases.intro);
    }

    randomFromArray(array) {
        return array[Math.floor(Math.random() * array.length)];
    }

    // Override getDisplayInfo para mostrar info de boss
    getDisplayInfo() {
        const baseInfo = super.getDisplayInfo();
        return {
            ...baseInfo,
            title: this.title,
            bossType: 'gladiator_warrior',
            enduranceStacks: this.enduranceStacks,
            ironGuardActive: this.ironGuardActive,
            gladiatorBonuses: this.gladiatorBonus,
            difficulty: 'Boss',
            specialFeatures: {
                reflectDamage: true,
                stackingBuffs: true,
                executionAttacks: true,
                battleDialogue: true
            }
        };
    }

    // Recompensas mejoradas para boss
    getRewards() {
        const baseRewards = super.getRewards();
        return {
            ...baseRewards,
            // Bosses dan recompensas extra
            bonusXP: Math.floor(baseRewards.xp * 0.5),
            prestigePoints: 1, // Nuevo sistema de prestigio
            uniqueLoot: this.getUniqueDrops()
        };
    }

    getUniqueDrops() {
        const drops = [
            'Gladiator\'s Shield Fragment',
            'Battle-Worn Gauntlet',
            'Arena Champion\'s Medal',
            'Iron Guard Technique Scroll'
        ];
        
        return drops[Math.floor(Math.random() * drops.length)];
    }
}

export default GladiatorWarrior;
