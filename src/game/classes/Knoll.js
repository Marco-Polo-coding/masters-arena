/**
 * Knoll.js - Medium Beast enemy
 * Bestia de tamaño medio con ataques salvajes y resistencia
 */

import BaseEnemy from './BaseEnemy.js';

class Knoll extends BaseEnemy {
    constructor(stage, playerLevel, playerStats, profile = 'normal') {
        super('medium_beast', stage, playerLevel, playerStats, profile);
        
        this.name = 'Knoll';
        this.description = 'A fierce medium-sized beast with savage instincts and pack tactics';
        
        // Habilidades específicas del Knoll
        this.abilities = {
            savageBite: {
                cooldown: 3,
                description: 'A vicious bite that causes bleeding'
            },
            howl: {
                cooldown: 5,
                description: 'Intimidating howl that reduces enemy initiative'
            },
            packTactics: {
                cooldown: 4,
                description: 'Gains bonus damage when enemy is wounded'
            }
        };

        // Añadir cooldowns específicos
        this.cooldowns.savageBite = 0;
        this.cooldowns.howl = 0;
        this.cooldowns.packTactics = 0;

        // El Knoll tiene resistencia natural
        this.naturalArmor = Math.floor(this.defense * 0.2);
    }

    getAvailableActions() {
        let actions = super.getAvailableActions();
        
        // Añadir habilidades específicas si no están en cooldown
        if (this.cooldowns.savageBite <= 0) {
            actions.push('savage_bite');
        }
        
        if (this.cooldowns.howl <= 0) {
            actions.push('howl');
        }

        if (this.cooldowns.packTactics <= 0) {
            actions.push('pack_tactics');
        }

        return actions;
    }

    evaluateActionPriority(action, context, classStrategy) {
        let priority = super.evaluateActionPriority(action, context, classStrategy);
        
        // Prioridades específicas del Knoll
        if (action === 'savage_bite' && context.playerLowHealth) {
            priority += 25; // Aprovechar para aplicar sangrado cuando el jugador está débil
        }
        
        if (action === 'howl' && context.enemyHealthy) {
            priority += 20; // Usar howl al inicio del combate
        }

        if (action === 'pack_tactics' && context.playerHPRatio < 0.6) {
            priority += 30; // Pack tactics es muy efectivo contra enemigos heridos
        }

        return priority;
    }

    // Habilidad específica: Savage Bite
    savageBite(target) {
        if (this.cooldowns.savageBite > 0) {
            return { success: false, message: "Savage bite is on cooldown!" };
        }

        const damage = this.calculateDamage(this.attackStat * 1.2); // Más daño que ataque normal
        this.cooldowns.savageBite = 3;
        this.lastAction = 'savage_bite';

        return {
            action: 'savage_bite',
            damage: damage,
            statusEffect: {
                type: 'bleed',
                duration: 4,
                source: 'knoll',
                damagePerTurn: Math.floor(this.attackStat * 0.3)
            },
            success: true,
            message: `${this.name} delivers a savage bite for ${damage} damage and causes bleeding!`
        };
    }

    // Habilidad específica: Howl
    howl(target) {
        if (this.cooldowns.howl > 0) {
            return { success: false, message: "Howl is on cooldown!" };
        }

        this.cooldowns.howl = 5;
        this.lastAction = 'howl';

        return {
            action: 'howl',
            damage: 0,
            statusEffect: {
                type: 'intimidated',
                duration: 3,
                source: 'knoll',
                effect: 'reduced_initiative_and_accuracy'
            },
            success: true,
            message: `${this.name} lets out a bone-chilling howl, intimidating you!`
        };
    }

    // Habilidad específica: Pack Tactics
    packTactics(target, targetContext) {
        if (this.cooldowns.packTactics > 0) {
            return { success: false, message: "Pack tactics is on cooldown!" };
        }

        const targetHPRatio = targetContext.hp / targetContext.maxHP;
        const bonusMultiplier = targetHPRatio < 0.5 ? 2.0 : 1.5; // Más daño si el objetivo está muy herido
        
        const damage = this.calculateDamage(this.attackStat * bonusMultiplier);
        this.cooldowns.packTactics = 4;
        this.lastAction = 'pack_tactics';

        return {
            action: 'pack_tactics',
            damage: damage,
            success: true,
            message: `${this.name} exploits your wounds with pack tactics for ${damage} damage!`
        };
    }

    // Override para incluir armor natural
    takeDamage(amount, source = 'unknown') {
        let finalDamage = amount;
        
        // Aplicar armor natural
        finalDamage = Math.max(1, finalDamage - this.naturalArmor);
        
        // Aplicar defensa si está en postura defensiva
        if (this.lastAction === 'defend') {
            const mitigation = Math.floor(this.defense * 0.5);
            finalDamage = Math.max(1, finalDamage - mitigation);
        }

        this.currentHP = Math.max(0, this.currentHP - finalDamage);
        
        if (this.currentHP <= 0) {
            this.isAlive = false;
        }

        return {
            damageTaken: finalDamage,
            armorMitigation: this.naturalArmor,
            currentHP: this.currentHP,
            isAlive: this.isAlive
        };
    }

    // Comportamiento específico del Knoll
    getClassCounterStrategy(playerClass, context) {
        const baseStrategy = super.getClassCounterStrategy(playerClass, context);
        
        // El Knoll es más agresivo y directo
        switch(playerClass) {
            case 'Warrior':
                return {
                    ...baseStrategy,
                    matchStrength: true,
                    useBleed: true, // Los warriors son susceptibles a status effects
                    prolongedFight: true
                };
            case 'Rogue':
                return {
                    ...baseStrategy,
                    overwhelmWithPower: true,
                    ignoreEvasion: true,
                    directAssault: true
                };
            case 'Mage':
                return {
                    ...baseStrategy,
                    rushDown: true,
                    resistSpells: true,
                    closeDistance: true
                };
            default:
                return baseStrategy;
        }
    }

    // El Knoll puede entrar en "Frenzy" cuando está herido
    checkFrenzyMode() {
        const hpRatio = this.currentHP / this.maxHP;
        
        if (hpRatio <= 0.3 && !this.statusEffects.frenzy) {
            this.applyStatusEffect('frenzy', 999, 'self'); // Permanente hasta morir
            this.attackStat = Math.floor(this.attackStat * 1.3);
            this.initiativeStat = Math.floor(this.initiativeStat * 1.2);
            
            return {
                triggered: true,
                message: `${this.name} enters a savage frenzy! Attack and initiative increased!`
            };
        }
        
        return { triggered: false };
    }

    startTurn() {
        const statusEffects = super.startTurn();
        const frenzyCheck = this.checkFrenzyMode();
        
        return {
            statusEffects: statusEffects,
            frenzy: frenzyCheck
        };
    }

    // Flavor text específico
    getFlavorText() {
        const texts = [
            "The knoll's yellow eyes gleam with predatory hunger.",
            "It paces back and forth, muscles tensed for action.",
            "The beast's low growl echoes through the arena.",
            "Saliva drips from its powerful jaws.",
            "The knoll sniffs the air, catching the scent of fear."
        ];
        
        return texts[Math.floor(Math.random() * texts.length)];
    }

    // Reacciones específicas
    reactToPlayerAction(playerAction) {
        const reactions = {
            'heavy_attack': [
                "The knoll snarls in pain and fury!",
                "The beast's eyes burn with rage!"
            ],
            'defend': [
                "The knoll circles, looking for weakness in your defense.",
                "It snaps at the air, frustrated by your caution."
            ],
            'elite': [
                "The knoll backs away, momentarily intimidated!",
                "The beast whimpers slightly at your display of power."
            ],
            'heal': [
                "The knoll growls in frustration as you recover.",
                "It paws the ground impatiently."
            ]
        };

        const actionReactions = reactions[playerAction];
        if (actionReactions) {
            return actionReactions[Math.floor(Math.random() * actionReactions.length)];
        }
        
        return null;
    }
}

export default Knoll;
