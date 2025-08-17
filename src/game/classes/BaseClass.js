/**
 * BaseClass - Clase padre que contiene toda la funcionalidad común
 * para Warrior, Rogue y Mage según el script de Master's Arena
 */

class BaseClass {
  constructor(classType, name = '') {
    // Identificación
    this.classType = classType
    this.name = name
    
    // Stats base (serán sobrescritos por cada clase específica)
    this.level = 1
    this.maxHP = 100
    this.currentHP = 100
    this.baseAttack = 6  // Escalado: 6, 12, 18, 24, 30
    this.attack = this.baseAttack // Inicializar attack
    this.defense = 10
    this.experience = 0
    this.experienceToNext = 100
    
    // Sistema de movimientos por turno
    this.movesPerTurn = this.level === 1 ? 1 : 2
    this.remainingMoves = this.movesPerTurn
    
    // Sistema de Cooldowns
    this.cooldowns = {
      heavy: 0,        // Heavy attack: usable cada 2 turnos
      elite: 0,        // Elite skill: available desde level 3
      heal: 0          // Healing: 2-turn cooldown
    }
    
    // Estados de combate
    this.isDefending = false
    this.cannotAttackNextTurn = false  // Después de heavy attack
    this.statusEffects = []
    
    // Sistema de tracking para mecánicas especiales
    this.combatTracking = {
      lightAttacksCount: 0,      // Para Shocked (cada 3 ataques)
      criticalNextAttack: false, // Para Expose
      stealthTurns: 0           // Para Rogue Stealth
    }
    
    // Sistema de Initiative
    this.baseInitiative = 10 + this.level * 2  // Escala con nivel
    this.currentInitiative = this.baseInitiative
    this.initiative = this.currentInitiative // Inicializar initiative
    
    // Inventario básico
    this.potions = 3
    this.maxPotions = 3
    this.gold = 0
    
    // Equipment slots
    this.equipment = {
      weapon: null,
      armor: null
    }
  }

  // ==================== SISTEMA DE LEVEL UP ====================
  
  /**
   * Sube de nivel al personaje
   * Level 1 → Level 2+: Cambia de 1 move a 2 moves por turno
   */
  levelUp() {
    this.level++
    this.experience = 0
    this.experienceToNext = this.level * 100  // Scaling XP requirement
    
    // Aumentar stats base
    this.maxHP += 20
    this.currentHP = this.maxHP  // Full heal on level up
    this.baseAttack += 6  // Escalado por tabla de 6
    this.defense += 5
    
    // Actualizar initiative con nivel
    this.baseInitiative = 10 + this.level * 2
    this.currentInitiative = this.baseInitiative
    
    // Actualizar sistema de moves
    this.movesPerTurn = this.level === 1 ? 1 : 2
    this.remainingMoves = this.movesPerTurn
    
    console.log(`${this.name} reached level ${this.level}!`)
    
    // Elite skill unlock a level 3
    if (this.level === 3) {
      console.log(`${this.name} unlocked Elite Skill!`)
    }
  }

  /**
   * Añadir experiencia y verificar level up
   */
  gainExperience(amount) {
    this.experience += amount
    
    while (this.experience >= this.experienceToNext) {
      this.levelUp()
    }
  }

  // ==================== SISTEMA DE TURNOS ====================
  
  /**
   * Iniciar nuevo turno - resetea moves y actualiza cooldowns
   */
  startTurn() {
    this.remainingMoves = this.movesPerTurn
    this.isDefending = false
    
    // Update cooldowns
    this.tickCooldowns()
    
    // Process status effects
    this.processStatusEffects()
    
    // Check if cannot attack (post-heavy attack penalty)
    if (this.cannotAttackNextTurn) {
      this.cannotAttackNextTurn = false
      console.log(`${this.name} cannot attack this turn (recovering from heavy attack)`)
    }
  }

  /**
   * Usar un movimiento
   */
  useMove() {
    if (this.remainingMoves > 0) {
      this.remainingMoves--
      return true
    }
    return false
  }

  /**
   * Verificar si puede realizar una acción
   */
  canPerformAction(actionType) {
    switch (actionType) {
      case 'light':
        return this.remainingMoves > 0 && !this.cannotAttackNextTurn
      
      case 'heavy':
        return this.remainingMoves > 0 && 
               this.cooldowns.heavy === 0 && 
               !this.cannotAttackNextTurn
      
      case 'defend':
        return this.remainingMoves > 0
      
      case 'heal':
        return this.remainingMoves > 0 && 
               this.cooldowns.heal === 0 && 
               this.potions > 0
      
      case 'elite':
        return this.level >= 3 && 
               this.cooldowns.elite === 0 && 
               this.remainingMoves >= 2  // Elite consumes both moves
      
      default:
        return false
    }
  }

  // ==================== SISTEMA DE COMBAT ACTIONS ====================
  
  /**
   * Light Attack - Siempre disponible (base para todas las clases)
   */
  lightAttack() {
    if (!this.canPerformAction('light')) {
      return { success: false, message: "Cannot perform light attack" }
    }
    
    this.useMove()
    
    // Tracking para Shocked (Mage mechanic)
    this.combatTracking.lightAttacksCount++
    
    let damage = this.calculateLightDamage()
    let isCritical = false
    let shockBonus = 0
    
    // Verificar si es crítico (Expose effect)
    if (this.combatTracking.criticalNextAttack || this.hasStatusEffect('expose')) {
      damage = Math.floor(damage * 1.5) // 1.5x damage for critical
      isCritical = true
      this.combatTracking.criticalNextAttack = false
      this.removeStatusEffect('expose') // Consume expose
    }
    
    // Verificar Shocked proc (cada 3 light attacks para Mage)
    if (this.classType === 'mage' && this.combatTracking.lightAttacksCount % 3 === 0) {
      let shockBaseDamage = 6
      if (this.level >= 4) shockBaseDamage *= 2
      if (this.level >= 5) shockBaseDamage *= 2
      
      shockBonus = shockBaseDamage
      damage += shockBonus
      console.log(`⚡ Shocked proc! +${shockBonus} electric damage`)
    }
    
    const criticalText = isCritical ? " (CRITICAL HIT!)" : ""
    const shockText = shockBonus > 0 ? ` +${shockBonus} shock` : ""
    
    return {
      success: true,
      action: 'light',
      damage: damage,
      isCritical: isCritical,
      shockBonus: shockBonus,
      message: `${this.name} performs light attack for ${damage} damage${criticalText}${shockText}`
    }
  }

  /**
   * Heavy Attack - Cada 2 turnos, siguiente turno no puede atacar
   */
  heavyAttack() {
    if (!this.canPerformAction('heavy')) {
      return { success: false, message: "Heavy attack on cooldown or cannot attack" }
    }
    
    this.useMove()
    this.cooldowns.heavy = 2
    this.cannotAttackNextTurn = true
    
    const damage = this.calculateHeavyDamage()
    
    return {
      success: true,
      action: 'heavy',
      damage: damage,
      message: `${this.name} performs heavy attack for ${damage} damage (cannot attack next turn)`
    }
  }

  /**
   * Defend - Implementado por cada clase específica
   */
  defend() {
    if (!this.canPerformAction('defend')) {
      return { success: false, message: "Cannot defend" }
    }
    
    this.useMove()
    this.isDefending = true
    
    return {
      success: true,
      action: 'defend',
      message: `${this.name} is defending`
    }
  }

  /**
   * Heal - Usar poción con cooldown de 2 turnos
   */
  heal() {
    if (!this.canPerformAction('heal')) {
      return { success: false, message: "Cannot heal (no potions or on cooldown)" }
    }
    
    this.useMove()
    this.potions--
    this.cooldowns.heal = 2
    
    const healAmount = Math.floor(this.maxHP * 0.4) // 40% heal
    this.currentHP = Math.min(this.maxHP, this.currentHP + healAmount)
    
    return {
      success: true,
      action: 'heal',
      healAmount: healAmount,
      message: `${this.name} heals for ${healAmount} HP`
    }
  }

  // ==================== CÁLCULOS DE DAÑO BASE ====================
  
  /**
   * Calcular daño de light attack (será sobrescrito por cada clase)
   */
  calculateLightDamage() {
    return this.baseAttack + this.getEquipmentAttackBonus()
  }

  /**
   * Calcular daño de heavy attack (~2x damage)
   */
  calculateHeavyDamage() {
    return Math.floor(this.calculateLightDamage() * 2)
  }

  /**
   * Calcular mitigación de daño al defenderse
   */
  calculateDefenseMitigation(incomingDamage) {
    if (!this.isDefending) return incomingDamage
    
    const totalDefense = this.defense + this.getEquipmentDefenseBonus()
    const mitigatedDamage = Math.max(1, incomingDamage - totalDefense)
    
    return mitigatedDamage
  }

  // ==================== SISTEMA DE EQUIPMENT ====================
  
  getEquipmentAttackBonus() {
    let bonus = 0
    if (this.equipment.weapon) {
      bonus += this.equipment.weapon.attackBonus || 0
    }
    return bonus
  }

  getEquipmentDefenseBonus() {
    let bonus = 0
    if (this.equipment.armor) {
      bonus += this.equipment.armor.defenseBonus || 0
    }
    return bonus
  }

  equipItem(item) {
    if (item.type === 'weapon') {
      this.equipment.weapon = item
    } else if (item.type === 'armor') {
      this.equipment.armor = item
    }
  }

  // ==================== SISTEMA DE COOLDOWNS ====================
  
  /**
   * Reducir todos los cooldowns en 1
   */
  tickCooldowns() {
    Object.keys(this.cooldowns).forEach(key => {
      if (this.cooldowns[key] > 0) {
        this.cooldowns[key]--
      }
    })
  }

  // ==================== MÉTODOS DE COMPATIBILIDAD ====================
  
  // Método para compatibilidad con CombatSystem
  lightAttack(target) {
    // Redirigir al método de ataque ligero correcto según la clase
    if (this.classType === 'warrior') {
      return this.shieldBash ? this.shieldBash(target) : this.performLightAttack(target);
    } else if (this.classType === 'rogue') {
      return this.doubleDaggers ? this.doubleDaggers(target) : this.performLightAttack(target);
    } else if (this.classType === 'mage') {
      return this.lightningWhip ? this.lightningWhip(target) : this.performLightAttack(target);
    }
    
    // Fallback a ataque básico
    return this.performLightAttack(target);
  }

  // Método para compatibilidad con CombatSystem
  heavyAttack(target) {
    // Redirigir al método de ataque pesado correcto según la clase
    if (this.classType === 'warrior') {
      return this.mightySwing ? this.mightySwing(target) : this.performHeavyAttack(target);
    } else if (this.classType === 'rogue') {
      return this.flurry ? this.flurry(target) : this.performHeavyAttack(target);
    } else if (this.classType === 'mage') {
      return this.iceSpikes ? this.iceSpikes(target) : this.performHeavyAttack(target);
    }
    
    // Fallback a ataque pesado básico
    return this.performHeavyAttack(target);
  }

  // Método para compatibilidad con CombatSystem
  defend() {
    // Redirigir al método de defensa correcto según la clase
    if (this.classType === 'warrior') {
      return this.block ? this.block() : this.performDefense();
    } else if (this.classType === 'rogue') {
      return this.dodge ? this.dodge() : this.performDefense();
    } else if (this.classType === 'mage') {
      return this.mistStep ? this.mistStep() : this.performDefense();
    }
    
    // Fallback a defensa básica
    return this.performDefense();
  }

  // Método para compatibilidad con CombatSystem
  eliteSkill(target, context) {
    // Redirigir al método elite correcto según la clase
    if (this.classType === 'warrior') {
      return this.endure ? this.endure() : { success: false, message: "Elite skill not available" };
    } else if (this.classType === 'rogue') {
      if (this.isStealthed && this.backstab) {
        return this.backstab(target);
      } else if (this.stealth) {
        return this.stealth();
      }
    } else if (this.classType === 'mage') {
      return this.firestorm ? this.firestorm(target) : { success: false, message: "Elite skill not available" };
    }
    
    return { success: false, message: "Elite skill not available" };
  }

  // Método de healing básico  
  heal() {
    return this.performHeal();
  }

  // Métodos base que pueden ser sobrescritos
  performLightAttack(target) {
    const damage = this.calculateBasicDamage(this.attack);
    
    return {
      action: 'light_attack',
      damage: damage,
      success: true,
      message: `${this.name} performs a light attack for ${damage} damage!`
    };
  }

  performHeavyAttack(target) {
    if (this.cooldowns.heavy > 0) {
      return { success: false, message: "Heavy attack is on cooldown!" };
    }

    const damage = this.calculateBasicDamage(this.attack * 2);
    this.cooldowns.heavy = 2;
    
    return {
      action: 'heavy_attack',
      damage: damage,
      success: true,
      message: `${this.name} performs a heavy attack for ${damage} damage!`
    };
  }

  performDefense() {
    const mitigation = Math.floor(this.defense * 0.4);
    
    return {
      action: 'defend',
      mitigation: mitigation,
      success: true,
      message: `${this.name} takes a defensive stance!`
    };
  }

  performHeal() {
    if (this.cooldowns.heal > 0) {
      return { success: false, message: "Heal is on cooldown!" };
    }

    const healAmount = Math.floor(this.maxHP * 0.3);
    this.currentHP = Math.min(this.maxHP, this.currentHP + healAmount);
    this.cooldowns.heal = 2;
    
    return {
      action: 'heal',
      healAmount: healAmount,
      success: true,
      message: `${this.name} heals for ${healAmount} HP!`
    };
  }

  // Utilidad para calcular daño básico
  calculateBasicDamage(baseDamage) {
    // Variabilidad de daño ±15%
    const variance = 0.15;
    const minDamage = Math.floor(baseDamage * (1 - variance));
    const maxDamage = Math.floor(baseDamage * (1 + variance));
    return Math.floor(Math.random() * (maxDamage - minDamage + 1)) + minDamage;
  }

  // Método para tomar daño (compatible con CombatSystem)
  takeDamage(amount, source = 'unknown', attacker = null) {
    let finalDamage = amount;
    
    // Aplicar defensa si está en postura defensiva
    if (this.lastAction === 'defend') {
      const mitigation = Math.floor(this.defense * 0.4);
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

  // Sistema de status effects (básico)
  applyStatusEffect(effect, duration, source) {
    if (!this.statusEffects) this.statusEffects = {};
    
    this.statusEffects[effect] = {
      duration: duration,
      source: source,
      appliedTurn: this.turnCount || 0
    };
  }

  // Procesar status effects al inicio de turno
  startTurn() {
    this.turnCount = (this.turnCount || 0) + 1;
    
    // Procesar cooldowns
    this.tickCooldowns();

    // Procesar status effects
    return this.processStatusEffects();
  }

  processStatusEffects() {
    if (!this.statusEffects) return [];
    
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
        const burnDamage = Math.floor(this.attack * 0.3);
        this.takeDamage(burnDamage, 'burn');
        return { effect: 'burn', damage: burnDamage };
      
      default:
        return null;
    }
  }

  // Propiedades para compatibilidad
  get isAlive() {
    return this.currentHP > 0;
  }

  set isAlive(value) {
    if (!value) {
      this.currentHP = 0;
    }
  }

  // ==================== SISTEMA DE STATUS EFFECTS ====================
  
  /**
   * Añadir efecto de estado (class-specific)
   */
  addStatusEffect(effect) {
    // Verificar si ya tiene el efecto
    const existingEffect = this.statusEffects.find(e => e.type === effect.type)
    
    if (existingEffect) {
      // Para efectos que no stackean, solo refresh duration
      if (effect.type === 'expose' || effect.type === 'chill') {
        existingEffect.duration = effect.duration
      } else {
        // Para efectos stackeables, añadir stack
        existingEffect.duration = effect.duration
        if (effect.stacks) {
          existingEffect.stacks = Math.min(existingEffect.maxStacks || 3, 
                                         (existingEffect.stacks || 1) + 1)
        }
      }
    } else {
      this.statusEffects.push({
        type: effect.type,
        duration: effect.duration,
        stacks: effect.stacks || 1,
        maxStacks: effect.maxStacks || 3,
        sourceClass: effect.sourceClass || 'unknown',
        damageScaling: effect.damageScaling || 1
      })
    }
  }

  /**
   * Procesar efectos de estado al inicio del turno
   */
  processStatusEffects() {
    this.statusEffects = this.statusEffects.filter(effect => {
      // Aplicar efecto
      const shouldContinue = this.applyStatusEffect(effect)
      
      // Reducir duración (excepto para efectos especiales)
      if (effect.type !== 'expose') { // Expose se consume al usarse
        effect.duration--
      }
      
      // Mantener si aún tiene duración y no fue consumido
      return effect.duration > 0 && shouldContinue
    })
  }

  /**
   * Aplicar efectos específicos según clase
   */
  applyStatusEffect(effect) {
    switch (effect.type) {
      case 'bleed': // Warrior-exclusive
        if (effect.sourceClass !== 'warrior') return false
        const bleedBaseDamage = Math.floor(this.baseAttack / 6) // baseAttack/6 = nivel base
        let bleedDamage = bleedBaseDamage
        
        // Escalado por nivel: x3 cada nivel desde level 3
        if (this.level >= 4) bleedDamage *= 3
        if (this.level >= 5) bleedDamage *= 3
        
        this.takeDamage(bleedDamage)
        console.log(`${this.name} takes ${bleedDamage} bleed damage`)
        break
      
      case 'burn': // Mage-exclusive (area damage after Firestorm)
        if (effect.sourceClass !== 'mage') return false
        const burnDamage = 12 * (this.level >= 4 ? 2 : 1) * (this.level >= 5 ? 2 : 1)
        this.takeDamage(burnDamage)
        console.log(`${this.name} takes ${burnDamage} burn damage from lingering fire`)
        break
      
      case 'shocked': // Mage-exclusive (every 3 light attacks)
        if (effect.sourceClass !== 'mage') return false
        // Este se maneja en el sistema de combate, no aquí
        break
      
      case 'expose': // Rogue-exclusive (next attack will be critical)
        if (effect.sourceClass !== 'rogue') return false
        // Este se consume cuando se hace el próximo ataque
        console.log(`${this.name} is exposed - next attack will be critical!`)
        return true // No se auto-consume aquí
      
      case 'chill': // Mage-exclusive (affects enemy cooldowns)
        if (effect.sourceClass !== 'mage') return false
        // Este efecto se aplica cuando el enemigo intenta usar habilidades
        console.log(`${this.name} is chilled - abilities take longer to recharge`)
        break
      
      default:
        console.warn(`Unknown status effect: ${effect.type}`)
    }
    
    return true // Continuar con el efecto
  }

  /**
   * Verificar si tiene un status effect específico
   */
  hasStatusEffect(effectType) {
    return this.statusEffects.some(effect => effect.type === effectType)
  }

  /**
   * Remover status effect específico (para cuando se consume)
   */
  removeStatusEffect(effectType) {
    this.statusEffects = this.statusEffects.filter(effect => effect.type !== effectType)
  }

  // ==================== SISTEMA DE DAÑO Y VIDA ====================
  
  /**
   * Recibir daño
   */
  takeDamage(damage) {
    const finalDamage = this.calculateDefenseMitigation(damage)
    this.currentHP = Math.max(0, this.currentHP - finalDamage)
    
    if (this.currentHP === 0) {
      console.log(`${this.name} has been defeated!`)
    }
    
    return finalDamage
  }

  /**
   * Verificar si está vivo
   */
  isAlive() {
    return this.currentHP > 0
  }

  /**
   * Restaurar HP completamente
   */
  fullHeal() {
    this.currentHP = this.maxHP
  }

  // ==================== SISTEMA DE INITIATIVE Y PROCS ====================
  
  /**
   * Roll de initiative para determinar orden de combate
   */
  rollInitiative(randomBonus = 0) {
    // Initiative base + random roll (1-10) + bonus
    this.currentInitiative = this.baseInitiative + Math.floor(Math.random() * 10) + 1 + randomBonus
    return this.currentInitiative
  }

  /**
   * Verificar proc de Chill (1/3 a 1/8 chance según balance)
   */
  chillProc(procChance = 0.25) { // Default 1/4 chance, ajustable para balance
    return Math.random() < procChance
  }

  /**
   * Aplicar Chill a enemigo (aumenta sus cooldowns)
   */
  applyChillToTarget(target) {
    if (this.classType !== 'mage') return false
    
    if (this.chillProc()) {
      // Aumentar todos los cooldowns del target en +1
      Object.keys(target.cooldowns).forEach(key => {
        if (target.cooldowns[key] > 0) {
          target.cooldowns[key]++
        }
      })
      
      // Añadir status effect visual
      target.addStatusEffect({
        type: 'chill',
        duration: 1, // Solo para mostrar que está chilled
        sourceClass: 'mage'
      })
      
      console.log(`❄️ ${target.name} is chilled! Cooldowns increased by 1 turn`)
      return true
    }
    
    return false
  }

  /**
   * Sistema de Second Run (Gemstones en lugar de levels)
   */
  addGemstone(gemstoneType) {
    if (!this.gemstones) {
      this.gemstones = {
        count: 0,
        types: []
      }
    }
    
    this.gemstones.count++
    this.gemstones.types.push(gemstoneType)
    
    // Aplicar mejoras similares a level up pero escaladas para second run
    this.maxHP += 30  // Más HP que level up normal
    this.currentHP = this.maxHP
    this.baseAttack += 9  // Más ataque que level up normal
    this.defense += 8     // Más defensa que level up normal
    
    // Reset potions según stage
    if (this.gemstones.count === 1) { // After stage 1
      this.maxPotions = 6
      this.potions = 6
    } else if (this.gemstones.count === 2) { // After stage 2
      this.maxPotions = 9
      this.potions = 9
    }
    
    console.log(`💎 ${this.name} acquired ${gemstoneType} gemstone! Power increased significantly.`)
  }

  // ==================== UTILIDADES EXTENDIDAS ====================
  
  /**
   * Obtener información completa del personaje
   */
  getStats() {
    return {
      name: this.name,
      class: this.classType,
      level: this.level,
      hp: `${this.currentHP}/${this.maxHP}`,
      attack: this.baseAttack + this.getEquipmentAttackBonus(),
      defense: this.defense + this.getEquipmentDefenseBonus(),
      experience: `${this.experience}/${this.experienceToNext}`,
      movesRemaining: this.remainingMoves,
      cooldowns: { ...this.cooldowns },
      statusEffects: [...this.statusEffects],
      potions: this.potions,
      gold: this.gold
    }
  }

  /**
   * Reset para nuevo combate
   */
  resetForCombat() {
    this.remainingMoves = this.movesPerTurn
    this.isDefending = false
    this.cannotAttackNextTurn = false
    this.statusEffects = []
    
    // Reset combat tracking
    this.combatTracking = {
      lightAttacksCount: 0,
      criticalNextAttack: false,
      stealthTurns: 0
    }
    
    // Reset initiative para nuevo combate
    this.currentInitiative = this.baseInitiative
  }
}

export default BaseClass;
