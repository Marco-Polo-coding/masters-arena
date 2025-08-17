/**
 * GiantLizard.js - Large Beast enemy
 * Bestia grande con mucha vida pero stats reducidas (excepto HP)
 */

import BaseEnemy from './BaseEnemy.js';

class GiantLizard extends BaseEnemy {
    constructor(stage, playerLevel, playerStats, profile = 'normal') {
        super('large_beast', stage, playerLevel, playerStats, profile);
        
        this.name = 'Giant Lizard';
        this.description = 'A massive reptilian beast with thick scales and devastating tail attacks';
        
        // Habilidades específicas del Giant Lizard
        this.abilities = {
            tailWhip: {
                cooldown: 2,
                description: 'Sweeping tail attack that can hit multiple times'
            },
            venomSpit: {
                cooldown: 4,
                description: 'Spits venom that poisons and reduces healing'
            },
            scaleHardening: {
                cooldown: 6,
                description: 'Hardens scales, increasing defense temporarily'
            },
            crushingBite: {
                cooldown: 5,
                description: 'Powerful bite that can stun the enemy'
            }
        };

        // Añadir cooldowns específicos
        this.cooldowns.tailWhip = 0;
        this.cooldowns.venomSpit = 0;
        this.cooldowns.scaleHardening = 0;
        this.cooldowns.crushingBite = 0;

        // El Giant Lizard tiene escalas naturales (más defensa)
        this.naturalScales = Math.floor(this.defense * 0.4);
        this.scalesHardened = false;
    }

    getAvailableActions() {
        let actions = super.getAvailableActions();
        
        // Añadir habilidades específicas si no están en cooldown
        if (this.cooldowns.tailWhip <= 0) {
            actions.push('tail_whip');
        }
        
        if (this.cooldowns.venomSpit <= 0) {
            actions.push('venom_spit');
        }

        if (this.cooldowns.scaleHardening <= 0) {
            actions.push('scale_hardening');
        }

        if (this.cooldowns.crushingBite <= 0) {
            actions.push('crushing_bite');
        }

        return actions;
    }

    evaluateActionPriority(action, context, classStrategy) {
        let priority = super.evaluateActionPriority(action, context, classStrategy);
        
        // Prioridades específicas del Giant Lizard
        if (action === 'tail_whip' && context.playerHealthy) {
            priority += 20; // Tail whip es bueno para daño consistente
        }
        
        if (action === 'venom_spit' && !context.playerHasStatusEffects) {
            priority += 25; // Aplicar veneno si no tiene efectos
        }

        if (action === 'scale_hardening' && !this.scalesHardened && context.enemyLowHealth) {
            priority += 30; // Usar defensivo cuando está herido
        }

        if (action === 'crushing_bite' && context.playerLowHealth) {
            priority += 35; // Finishing move
        }

        return priority;
    }

    // Habilidad específica: Tail Whip
    tailWhip(target) {
        if (this.cooldowns.tailWhip > 0) {
            return { success: false, message: "Tail whip is on cooldown!" };
        }

        // El tail whip puede golpear múltiples veces
        const hits = Math.random() < 0.3 ? 2 : 1; // 30% chance de double hit
        let totalDamage = 0;
        let messages = [];

        for (let i = 0; i < hits; i++) {
            const damage = this.calculateDamage(this.attack * 0.8);
            totalDamage += damage;
            messages.push(`Hit ${i + 1}: ${damage} damage`);
        }

        this.cooldowns.tailWhip = 2;
        this.lastAction = 'tail_whip';

        return {
            action: 'tail_whip',
            damage: totalDamage,
            hits: hits,
            success: true,
            message: `${this.name} lashes out with its massive tail! ${messages.join(', ')} (Total: ${totalDamage} damage)`
        };
    }

    // Habilidad específica: Venom Spit
    venomSpit(target) {
        if (this.cooldowns.venomSpit > 0) {
            return { success: false, message: "Venom spit is on cooldown!" };
        }

        const damage = this.calculateDamage(this.attack * 0.6); // Menos daño directo
        this.cooldowns.venomSpit = 4;
        this.lastAction = 'venom_spit';

        return {
            action: 'venom_spit',
            damage: damage,
            statusEffect: {
                type: 'toxic_venom',
                duration: 5,
                source: 'giant_lizard',
                effect: 'poison_and_reduced_healing',
                damagePerTurn: Math.floor(this.attack * 0.25),
                healingReduction: 0.5 // Reduce healing by 50%
            },
            success: true,
            message: `${this.name} spits toxic venom for ${damage} damage and applies deadly poison!`
        };
    }

    // Habilidad específica: Scale Hardening
    scaleHardening(target) {
        if (this.cooldowns.scaleHardening > 0) {
            return { success: false, message: "Scale hardening is on cooldown!" };
        }

        this.cooldowns.scaleHardening = 6;
        this.scalesHardened = true;
        this.lastAction = 'scale_hardening';

        // Añadir buff temporal
        this.applyStatusEffect('hardened_scales', 4, 'self');

        return {
            action: 'scale_hardening',
            damage: 0,
            buff: {
                type: 'defense_boost',
                amount: Math.floor(this.defense * 0.5),
                duration: 4
            },
            success: true,
            message: `${this.name} hardens its scales, greatly increasing its defense!`
        };
    }

    // Habilidad específica: Crushing Bite
    crushingBite(target) {
        if (this.cooldowns.crushingBite > 0) {
            return { success: false, message: "Crushing bite is on cooldown!" };
        }

        const damage = this.calculateDamage(this.attack * 1.8); // Muy alto daño
        this.cooldowns.crushingBite = 5;
        this.lastAction = 'crushing_bite';

        return {
            action: 'crushing_bite',
            damage: damage,
            statusEffect: {
                type: 'stunned',
                duration: 1,
                source: 'giant_lizard',
                effect: 'skip_next_turn'
            },
            success: true,
            message: `${this.name} delivers a crushing bite for ${damage} damage and stuns you!`
        };
    }

    // Override takeDamage para incluir escalas
    takeDamage(amount, source = 'unknown') {
        let finalDamage = amount;
        
        // Aplicar escalas naturales
        finalDamage = Math.max(1, finalDamage - this.naturalScales);
        
        // Si las escalas están endurecidas, defensa adicional
        if (this.scalesHardened && this.statusEffects.hardened_scales) {
            const bonusDefense = Math.floor(this.defense * 0.5);
            finalDamage = Math.max(1, finalDamage - bonusDefense);
        }
        
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
            scaleMitigation: this.naturalScales,
            hardenedScales: this.scalesHardened,
            currentHP: this.currentHP,
            isAlive: this.isAlive
        };
    }

    // Comportamiento específico del Giant Lizard
    getClassCounterStrategy(playerClass, context) {
        const baseStrategy = super.getClassCounterStrategy(playerClass, context);
        
        // El Giant Lizard es tanky y defensivo
        switch(playerClass) {
            case 'Warrior':
                return {
                    ...baseStrategy,
                    tankFight: true,
                    useVenom: true, // Status effects contra warrior
                    outlastOpponent: true
                };
            case 'Rogue':
                return {
                    ...baseStrategy,
                    ignoreSpeed: true,
                    useAreaAttacks: true, // Tail whip contra rogue evasivo
                    sustainedDamage: true
                };
            case 'Mage':
                return {
                    ...baseStrategy,
                    resistMagic: true,
                    useStuns: true, // Interrumpir spells
                    closeCombat: true
                };
            default:
                return baseStrategy;
        }
    }

    // El Giant Lizard puede entrar en "Berserker" cuando está muy herido
    checkBerserkerMode() {
        const hpRatio = this.currentHP / this.maxHP;
        
        if (hpRatio <= 0.2 && !this.statusEffects.berserker) {
            this.applyStatusEffect('berserker', 999, 'self');
            
            // Berserker mode: más ataque, menos defensa
            this.attack = Math.floor(this.attack * 1.5);
            this.naturalScales = Math.floor(this.naturalScales * 0.5);
            
            return {
                triggered: true,
                message: `${this.name} enters a desperate berserker rage! Massively increased attack but reduced defense!`
            };
        }
        
        return { triggered: false };
    }

    startTurn() {
        const statusEffects = super.startTurn();
        const berserkerCheck = this.checkBerserkerMode();
        
        // Verificar si las escalas endurecidas han expirado
        if (!this.statusEffects.hardened_scales) {
            this.scalesHardened = false;
        }
        
        return {
            statusEffects: statusEffects,
            berserker: berserkerCheck,
            scalesStatus: this.scalesHardened
        };
    }

    // Flavor text específico
    getFlavorText() {
        const texts = [
            "The giant lizard's scales gleam in the arena light.",
            "Its forked tongue flicks out, tasting the air.",
            "The massive reptile's eyes follow your every movement.",
            "Its tail swishes slowly, ready to strike.",
            "The lizard hisses softly, a sound like steam escaping.",
            "Thick scales ripple across its muscular frame."
        ];
        
        return texts[Math.floor(Math.random() * texts.length)];
    }

    // Reacciones específicas
    reactToPlayerAction(playerAction) {
        const reactions = {
            'heavy_attack': [
                "The lizard recoils from the powerful blow, scales cracking!",
                "It lets out a deep, rumbling hiss of pain!"
            ],
            'defend': [
                "The giant lizard circles slowly, in no rush to attack.",
                "It studies your defensive posture with cold reptilian eyes."
            ],
            'elite': [
                "The massive beast takes a step back, temporarily awed!",
                "Its hiss turns to a worried warble."
            ],
            'heal': [
                "The lizard tilts its head, seemingly puzzled by your recovery.",
                "It flicks its tongue, sensing your renewed strength."
            ]
        };

        const actionReactions = reactions[playerAction];
        if (actionReactions) {
            return actionReactions[Math.floor(Math.random() * actionReactions.length)];
        }
        
        return null;
    }

    // Override getDisplayInfo para mostrar info específica
    getDisplayInfo() {
        const baseInfo = super.getDisplayInfo();
        return {
            ...baseInfo,
            naturalScales: this.naturalScales,
            scalesHardened: this.scalesHardened,
            specialFeatures: {
                tankiness: 'Very High',
                scaledDefense: true,
                multiHitAttacks: true,
                venomousAttacks: true
            }
        };
    }
}

export default GiantLizard;
