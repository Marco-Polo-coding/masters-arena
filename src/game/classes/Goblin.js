/**
 * Goblin.js - Small Humanoid enemy
 * Enemigo básico con habilidades simples pero efectivas
 */

import BaseEnemy from './BaseEnemy.js';

class Goblin extends BaseEnemy {
    constructor(stage, playerLevel, playerStats, profile = 'normal') {
        super('small_humanoid', stage, playerLevel, playerStats, profile);
        
        this.name = 'Goblin';
        this.description = 'A small, cunning humanoid with basic combat skills';
        
        // Habilidades específicas del Goblin
        this.abilities = {
            poisonedBlade: {
                cooldown: 3,
                description: 'Attacks with a poisoned blade, applying poison'
            },
            dirtyFighting: {
                cooldown: 4,
                description: 'Throws dirt to reduce enemy accuracy'
            }
        };

        // Añadir cooldowns específicos
        this.cooldowns.poisonedBlade = 0;
        this.cooldowns.dirtyFighting = 0;
    }

    getAvailableActions() {
        let actions = super.getAvailableActions();
        
        // Añadir habilidades específicas si no están en cooldown
        if (this.cooldowns.poisonedBlade <= 0) {
            actions.push('poisoned_blade');
        }
        
        if (this.cooldowns.dirtyFighting <= 0) {
            actions.push('dirty_fighting');
        }

        return actions;
    }

    evaluateActionPriority(action, context, classStrategy) {
        let priority = super.evaluateActionPriority(action, context, classStrategy);
        
        // Prioridades específicas del Goblin
        if (action === 'poisoned_blade' && !context.playerHasStatusEffects) {
            priority += 20; // Priorizar aplicar veneno si el jugador no tiene efectos
        }
        
        if (action === 'dirty_fighting' && context.playerHealthy) {
            priority += 15; // Usar dirty fighting cuando el jugador está sano
        }

        return priority;
    }

    // Habilidad específica: Poisoned Blade
    poisonedBlade(target) {
        if (this.cooldowns.poisonedBlade > 0) {
            return { success: false, message: "Poisoned blade is on cooldown!" };
        }

        const damage = this.calculateDamage(this.attack * 0.8); // Menos daño pero con veneno
        this.cooldowns.poisonedBlade = 3;
        this.lastAction = 'poisoned_blade';

        return {
            action: 'poisoned_blade',
            damage: damage,
            statusEffect: {
                type: 'poison',
                duration: 3,
                source: 'goblin'
            },
            success: true,
            message: `${this.name} strikes with a poisoned blade for ${damage} damage and applies poison!`
        };
    }

    // Habilidad específica: Dirty Fighting
    dirtyFighting(target) {
        if (this.cooldowns.dirtyFighting > 0) {
            return { success: false, message: "Dirty fighting is on cooldown!" };
        }

        this.cooldowns.dirtyFighting = 4;
        this.lastAction = 'dirty_fighting';

        return {
            action: 'dirty_fighting',
            damage: 0,
            statusEffect: {
                type: 'blinded',
                duration: 2,
                source: 'goblin',
                effect: 'reduced_accuracy'
            },
            success: true,
            message: `${this.name} throws dirt in your eyes, reducing your accuracy!`
        };
    }

    // Comportamiento específico del Goblin
    getClassCounterStrategy(playerClass, context) {
        const baseStrategy = super.getClassCounterStrategy(playerClass, context);
        
        // El Goblin es más astuto contra ciertas clases
        switch(playerClass) {
            case 'Warrior':
                return {
                    ...baseStrategy,
                    preferHitAndRun: true,
                    avoidDirectConfrontation: true
                };
            case 'Rogue':
                return {
                    ...baseStrategy,
                    useStatusEffects: true,
                    matchAgility: true
                };
            case 'Mage':
                return {
                    ...baseStrategy,
                    rushDown: true,
                    interruptSpells: true
                };
            default:
                return baseStrategy;
        }
    }

    // Flavor text y personalidad
    getFlavorText() {
        const texts = [
            "The goblin hisses and bares its yellowed teeth.",
            "Beady eyes dart around, looking for an opportunity.",
            "The goblin mutters something in a guttural language.",
            "It grips its crude weapon with surprising skill."
        ];
        
        return texts[Math.floor(Math.random() * texts.length)];
    }

    // Reacciones específicas a acciones del jugador
    reactToPlayerAction(playerAction) {
        const reactions = {
            'heavy_attack': [
                "The goblin stumbles backward from the powerful blow!",
                "\"Ow! That hurt, you big meanie!\""
            ],
            'defend': [
                "The goblin circles around, looking for an opening.",
                "\"Hiding behind that shield, eh?\""
            ],
            'elite': [
                "The goblin's eyes widen in fear at your display of power!",
                "\"That's not fair! No fair!\""
            ]
        };

        const actionReactions = reactions[playerAction];
        if (actionReactions) {
            return actionReactions[Math.floor(Math.random() * actionReactions.length)];
        }
        
        return null;
    }
}

export default Goblin;
