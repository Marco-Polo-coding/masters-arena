/**
 * Warrior Class - Implementa todas las mecánicas específicas del Warrior
 * Hereda de BaseClass y añade:
 * - Block defense (damage mitigation basada en defense stat)
 * - Endure elite skill (damage boost + damage mitigation + bleed application)
 * - One-handed/Two-handed weapon attacks
 */

import BaseClass from './BaseClass.js'

class Warrior extends BaseClass {
  constructor(name = '') {
    super('warrior', name)
    
    // Stats específicos del Warrior (más defensivos)
    this.maxHP = 120  // +20 HP base comparado con otras clases
    this.currentHP = 120
    this.defense = 15  // +5 DEF base comparado con otras clases
    
    // Warrior-specific cooldowns
    this.cooldowns.endure = 0  // Elite skill cooldown
    
    // Warrior-specific tracking
    this.endureStacks = 0      // Para el sistema de stacking defense
    this.endureTurnsLeft = 0   // Duración del buff de Endure
  }

  // ==================== WARRIOR-SPECIFIC ATTACKS ====================
  
  /**
   * Light Attack - One-handed weapon attack
   * Mantiene el damage base pero con flavor específico
   */
  lightAttack() {
    const result = super.lightAttack()
    
    if (result.success) {
      result.message = `${this.name} strikes with one-handed weapon for ${result.damage} damage`
      result.weaponType = 'one-handed'
    }
    
    return result
  }

  /**
   * Heavy Attack - Two-handed weapon attack
   * Aplica el sistema base pero con flavor y posible Endure boost
   */
  heavyAttack() {
    if (!this.canPerformAction('heavy')) {
      return { success: false, message: "Heavy attack on cooldown or cannot attack" }
    }
    
    this.useMove()
    this.cooldowns.heavy = 2
    this.cannotAttackNextTurn = true
    
    let damage = this.calculateHeavyDamage()
    
    // Aplicar boost de Endure si está activo
    if (this.endureTurnsLeft > 0) {
      const endureBoost = Math.floor(damage * this.getEndureDamageMultiplier())
      damage += endureBoost
      console.log(`🔥 Endure boosts attack by ${endureBoost} damage!`)
    }
    
    return {
      success: true,
      action: 'heavy',
      damage: damage,
      weaponType: 'two-handed',
      message: `${this.name} delivers powerful two-handed strike for ${damage} damage (cannot attack next turn)`
    }
  }

  // ==================== WARRIOR DEFENSE - BLOCK ====================
  
  /**
   * Block Defense - Warrior-specific defense
   * Mitigación plana basada en defense stat (como en tu ejemplo)
   */
  defend() {
    if (!this.canPerformAction('defend')) {
      return { success: false, message: "Cannot defend" }
    }
    
    this.useMove()
    this.isDefending = true
    
    const totalDefense = this.defense + this.getEquipmentDefenseBonus() + (this.endureStacks * 5)
    
    return {
      success: true,
      action: 'defend',
      defenseType: 'block',
      defenseValue: totalDefense,
      message: `${this.name} raises shield to block (${totalDefense} defense)`
    }
  }

  /**
   * Override damage mitigation para implementar Block específico
   */
  calculateDefenseMitigation(incomingDamage) {
    if (!this.isDefending) return incomingDamage
    
    // Warrior Block: Mitigación plana (tu ejemplo: 20HP, 10DEF, 15DMG → 5DMG)
    const totalDefense = this.defense + this.getEquipmentDefenseBonus() + (this.endureStacks * 5)
    const mitigatedDamage = Math.max(1, incomingDamage - totalDefense)
    
    console.log(`🛡️ Block mitigates ${incomingDamage - mitigatedDamage} damage (${totalDefense} defense)`)
    
    return mitigatedDamage
  }

  // ==================== ENDURE ELITE SKILL ====================
  
  /**
   * Endure Elite Skill - Warrior's signature ability
   * - Aumenta damage temporalmente
   * - Otorga damage mitigation para el siguiente turno
   * - Aplica Bleed al enemigo
   */
  eliteSkill() {
    if (!this.canPerformAction('elite')) {
      return { 
        success: false, 
        message: "Endure not available (level 3+, on cooldown, or insufficient moves)" 
      }
    }
    
    // Consume both moves
    this.remainingMoves = 0
    this.cooldowns.endure = this.getEndureCooldown()
    
    // Activar Endure buff
    this.endureTurnsLeft = 2  // Dura 2 turnos
    this.endureStacks = Math.min(3, this.endureStacks + 1)  // Max 3 stacks
    
    // Calcular valores según nivel
    const damageBoost = this.getEndureDamageMultiplier()
    const mitigation = this.getEndureMitigation()
    
    return {
      success: true,
      action: 'elite',
      skillName: 'endure',
      damageBoostPercent: Math.floor(damageBoost * 100),
      mitigationPercent: Math.floor(mitigation * 100),
      stacks: this.endureStacks,
      message: `${this.name} channels inner strength! +${Math.floor(damageBoost * 100)}% damage, ${Math.floor(mitigation * 100)}% damage reduction next turn`
    }
  }

  /**
   * Aplicar Bleed al enemigo cuando usa Endure
   */
  applyEndureBleed(target) {
    if (this.endureTurnsLeft <= 0) return false
    
    // Bleed damage escalado según nivel como especificaste
    const bleedDamage = this.calculateBleedDamage()
    
    target.addStatusEffect({
      type: 'bleed',
      duration: 3, // 3 turnos de bleed
      sourceClass: 'warrior',
      damageScaling: bleedDamage
    })
    
    console.log(`🩸 ${target.name} starts bleeding for ${bleedDamage} damage per turn!`)
    return true
  }

  // ==================== ENDURE CALCULATIONS ====================
  
  /**
   * Calcular multiplicador de daño de Endure según nivel
   */
  getEndureDamageMultiplier() {
    switch (this.level) {
      case 3: return 0.15  // +15% damage
      case 4: return 0.25  // +25% damage  
      case 5: return 0.35  // +35% damage
      default: return 0.15
    }
  }

  /**
   * Calcular mitigación de daño de Endure según nivel
   * Level 3: 1/3, Level 4: 2/3, Level 5: full immunity (como dijiste)
   */
  getEndureMitigation() {
    switch (this.level) {
      case 3: return 0.33  // 33% damage reduction
      case 4: return 0.66  // 66% damage reduction
      case 5: return 1.0   // 100% damage reduction (immunity)
      default: return 0.33
    }
  }

  /**
   * Calcular cooldown de Endure (se reduce con nivel)
   */
  getEndureCooldown() {
    switch (this.level) {
      case 3: return 5  // 5 turnos cooldown
      case 4: return 4  // 4 turnos cooldown
      case 5: return 3  // 3 turnos cooldown
      default: return 5
    }
  }

  /**
   * Calcular daño de Bleed según tu especificación
   * Level 3 (24 dmg) → 4 bleed, Level 4 (30 dmg) → 12 bleed, Level 5 (36 dmg) → 36 bleed
   */
  calculateBleedDamage() {
    const baseDamage = Math.floor(this.baseAttack / 6) // baseAttack/6 = nivel
    
    switch (this.level) {
      case 3: return baseDamage      // 4 damage
      case 4: return baseDamage * 3  // 12 damage  
      case 5: return baseDamage * 9  // 36 damage (4 * 3 * 3)
      default: return baseDamage
    }
  }

  // ==================== WARRIOR TURN MANAGEMENT ====================
  
  /**
   * Override startTurn para manejar Endure timing
   */
  startTurn() {
    super.startTurn()
    
    // Reducir duración de Endure
    if (this.endureTurnsLeft > 0) {
      this.endureTurnsLeft--
      
      if (this.endureTurnsLeft === 0) {
        this.endureStacks = 0  // Reset stacks cuando expira
        console.log(`💪 Endure effect expires`)
      }
    }
  }

  /**
   * Override takeDamage para aplicar mitigación de Endure
   */
  takeDamage(damage) {
    let finalDamage = damage
    
    // Aplicar mitigación normal (Block)
    finalDamage = this.calculateDefenseMitigation(finalDamage)
    
    // Aplicar mitigación de Endure si está activo
    if (this.endureTurnsLeft > 0) {
      const endureMitigation = this.getEndureMitigation()
      const mitigatedAmount = Math.floor(finalDamage * endureMitigation)
      finalDamage -= mitigatedAmount
      
      console.log(`💪 Endure absorbs ${mitigatedAmount} damage!`)
      
      // Si tiene inmunidad completa (level 5)
      if (endureMitigation >= 1.0) {
        finalDamage = 0
        console.log(`🛡️ Complete damage immunity from Endure!`)
      }
    }
    
    // Aplicar daño final
    this.currentHP = Math.max(0, this.currentHP - finalDamage)
    
    if (this.currentHP === 0) {
      console.log(`${this.name} has been defeated!`)
    }
    
    return finalDamage
  }

  // ==================== WARRIOR UTILITIES ====================
  
  /**
   * Override getStats para incluir info específica del Warrior
   */
  getStats() {
    const baseStats = super.getStats()
    
    return {
      ...baseStats,
      defenseType: 'block',
      endureActive: this.endureTurnsLeft > 0,
      endureStacks: this.endureStacks,
      endureTurnsLeft: this.endureTurnsLeft,
      totalDefense: this.defense + this.getEquipmentDefenseBonus() + (this.endureStacks * 5)
    }
  }

  /**
   * Override resetForCombat para resetear estado de Endure
   */
  resetForCombat() {
    super.resetForCombat()
    
    this.endureStacks = 0
    this.endureTurnsLeft = 0
  }

  /**
   * Verificar si puede usar habilidades específicas
   */
  canUseEndure() {
    return this.canPerformAction('elite')
  }

  /**
   * Obtener info de Endure para UI
   */
  getEndureInfo() {
    return {
      available: this.canUseEndure(),
      cooldown: this.cooldowns.endure,
      currentStacks: this.endureStacks,
      turnsLeft: this.endureTurnsLeft,
      damageBoost: Math.floor(this.getEndureDamageMultiplier() * 100),
      mitigation: Math.floor(this.getEndureMitigation() * 100)
    }
  }
}

export default Warrior;
