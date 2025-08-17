/**
 * Rogue Class - Implementa todas las mecánicas específicas del Rogue
 * Hereda de BaseClass y añade:
 * - Double dagger light attack (2 hits por ataque)
 * - Flurry heavy attack (4 hits de longbow)
 * - Dodge defense (damage mitigation)
 * - Stealth/Backstab elite skill system
 * - Expose status effect application
 */

import BaseClass from './BaseClass.js'

class Rogue extends BaseClass {
  constructor(name = '') {
    super('rogue', name)
    
    // Stats específicos del Rogue (más balanceados, orientados a speed)
    this.maxHP = 100  // HP base normal
    this.currentHP = 100
    this.defense = 8   // -2 DEF base (más frágil que warrior)
    this.baseInitiative = 15 + this.level * 3  // +5 initiative base (más rápido)
    this.currentInitiative = this.baseInitiative
    
    // Rogue-specific cooldowns
    this.cooldowns.stealth = 0     // Stealth part of elite
    this.cooldowns.backstab = 0    // Backstab part of elite
    
    // Rogue-specific tracking
    this.isStealthed = false       // Estado de stealth
    this.stealthTurnsLeft = 0      // Duración del stealth
    this.backstabReady = false     // Si puede usar backstab
  }

  // ==================== ROGUE-SPECIFIC ATTACKS ====================
  
  /**
   * Light Attack - Double dagger strike (2 hits per attack)
   * Cada hit hace menos daño pero son 2 hits
   * Escalado: 3+3 → 6+6 → 9+9 (total: 6 → 12 → 18)
   */
  lightAttack() {
    if (!this.canPerformAction('light')) {
      return { success: false, message: "Cannot perform light attack" }
    }
    
    this.useMove()
    
    // Tracking para Shocked (Mage mechanic) - aunque Rogue no lo usa
    this.combatTracking.lightAttacksCount++
    
    // Calcular daño por dagger (dividido entre 2)
    const baseDamagePerHit = Math.floor((this.baseAttack + this.getEquipmentAttackBonus()) / 2)
    
    let firstHit = baseDamagePerHit
    let secondHit = baseDamagePerHit
    let totalDamage = firstHit + secondHit
    let isCritical = false
    
    // Verificar si es crítico (Expose effect o Backstab)
    if (this.combatTracking.criticalNextAttack || this.hasStatusEffect('expose') || this.backstabReady) {
      firstHit = Math.floor(firstHit * 1.5)
      secondHit = Math.floor(secondHit * 1.5)
      totalDamage = firstHit + secondHit
      isCritical = true
      
      this.combatTracking.criticalNextAttack = false
      this.removeStatusEffect('expose')
      
      // Si era backstab, aplicar bonus adicional y salir de stealth
      if (this.backstabReady) {
        const backstabBonus = this.getBackstabBonusDamage()
        totalDamage += backstabBonus
        this.backstabReady = false
        this.exitStealth()
        console.log(`🗡️ BACKSTAB! Additional ${backstabBonus} damage from shadows!`)
      }
    }
    
    const criticalText = isCritical ? " (CRITICAL HIT!)" : ""
    const stealthText = this.isStealthed ? " (from stealth)" : ""
    
    return {
      success: true,
      action: 'light',
      damage: totalDamage,
      hits: [firstHit, secondHit],
      isCritical: isCritical,
      weaponType: 'double-daggers',
      message: `${this.name} strikes with twin daggers: ${firstHit} + ${secondHit} = ${totalDamage} damage${criticalText}${stealthText}`
    }
  }

  /**
   * Heavy Attack - Flurry of longbow attacks
   * 4 hits de 3 damage cada uno base, escala igual que light attack total
   */
  heavyAttack() {
    if (!this.canPerformAction('heavy')) {
      return { success: false, message: "Heavy attack on cooldown or cannot attack" }
    }
    
    this.useMove()
    this.cooldowns.heavy = 2
    this.cannotAttackNextTurn = true
    
    // Salir de stealth si estaba stealthed (acción ofensiva)
    if (this.isStealthed) {
      this.exitStealth()
    }
    
    // 4 hits, cada uno hace 1/4 del daño total base
    const totalBaseDamage = this.baseAttack + this.getEquipmentAttackBonus()
    const damagePerArrow = Math.floor(totalBaseDamage / 4)
    
    const hits = [damagePerArrow, damagePerArrow, damagePerArrow, damagePerArrow]
    const totalDamage = hits.reduce((sum, hit) => sum + hit, 0)
    
    return {
      success: true,
      action: 'heavy',
      damage: totalDamage,
      hits: hits,
      weaponType: 'longbow',
      message: `${this.name} unleashes arrow flurry: ${hits.join(' + ')} = ${totalDamage} damage (cannot attack next turn)`
    }
  }

  // ==================== ROGUE DEFENSE - DODGE ====================
  
  /**
   * Dodge Defense - Rogue-specific defense
   * Mitigación porcentual basada en defense stat + level scaling
   */
  defend() {
    if (!this.canPerformAction('defend')) {
      return { success: false, message: "Cannot defend" }
    }
    
    this.useMove()
    this.isDefending = true
    
    const dodgeChance = this.calculateDodgeChance()
    
    return {
      success: true,
      action: 'defend',
      defenseType: 'dodge',
      dodgeChance: Math.floor(dodgeChance * 100),
      message: `${this.name} prepares to dodge (${Math.floor(dodgeChance * 100)}% dodge chance)`
    }
  }

  /**
   * Override damage mitigation para implementar Dodge específico
   */
  calculateDefenseMitigation(incomingDamage) {
    if (!this.isDefending) return incomingDamage
    
    // Rogue Dodge: Chance-based mitigation
    const dodgeChance = this.calculateDodgeChance()
    
    if (Math.random() < dodgeChance) {
      // Dodge completo
      console.log(`🏃 Complete dodge! No damage taken`)
      return 0
    } else {
      // Dodge parcial basado en defense
      const partialMitigation = Math.min(0.5, this.defense / 30) // Max 50% mitigation
      const mitigatedDamage = Math.floor(incomingDamage * (1 - partialMitigation))
      
      console.log(`🏃 Partial dodge! ${Math.floor(partialMitigation * 100)}% damage reduced`)
      return Math.max(1, mitigatedDamage)
    }
  }

  /**
   * Calcular probabilidad de dodge completo
   */
  calculateDodgeChance() {
    // Base chance + defense scaling + level scaling
    const baseChance = 0.15  // 15% base
    const defenseBonus = (this.defense + this.getEquipmentDefenseBonus()) / 100
    const levelBonus = (this.level - 1) * 0.05  // +5% per level above 1
    
    return Math.min(0.6, baseChance + defenseBonus + levelBonus)  // Max 60% dodge chance
  }

  // ==================== STEALTH/BACKSTAB ELITE SKILL ====================
  
  /**
   * Stealth/Backstab Elite Skill - Rogue's signature ability
   * - Stealth: Enemies cannot target you
   * - Backstab: Double damage while stealthed, usable while stealthed
   */
  eliteSkill() {
    if (!this.canPerformAction('elite')) {
      return { 
        success: false, 
        message: "Stealth/Backstab not available (level 3+, on cooldown, or insufficient moves)" 
      }
    }

    // Si ya está en stealth, puede hacer backstab
    if (this.isStealthed && this.canBackstab()) {
      return this.performBackstab()
    } else {
      return this.enterStealth()
    }
  }

  /**
   * Entrar en stealth
   */
  enterStealth() {
    // Consume both moves
    this.remainingMoves = 0
    this.cooldowns.stealth = this.getStealthCooldown()
    
    // Activar stealth
    this.isStealthed = true
    this.stealthTurnsLeft = this.getStealthDuration()
    this.backstabReady = false  // No puede backstab inmediatamente
    
    return {
      success: true,
      action: 'elite',
      skillName: 'stealth',
      duration: this.stealthTurnsLeft,
      message: `${this.name} vanishes into shadows! Untargetable for ${this.stealthTurnsLeft} turns`
    }
  }

  /**
   * Realizar backstab
   */
  performBackstab() {
    if (!this.canBackstab()) {
      return { success: false, message: "Backstab not ready" }
    }
    
    // Consume both moves
    this.remainingMoves = 0
    this.cooldowns.backstab = this.getBackstabCooldown()
    
    // Preparar backstab para el próximo ataque
    this.backstabReady = true
    
    const bonusDamage = this.getBackstabBonusDamage()
    
    return {
      success: true,
      action: 'elite',
      skillName: 'backstab',
      bonusDamage: bonusDamage,
      message: `${this.name} prepares lethal strike from shadows! Next attack will deal +${bonusDamage} bonus damage`
    }
  }

  /**
   * Salir de stealth (cuando ataca o el tiempo se acaba)
   */
  exitStealth() {
    if (!this.isStealthed) return
    
    this.isStealthed = false
    this.stealthTurnsLeft = 0
    this.backstabReady = false
    
    console.log(`👤 ${this.name} emerges from stealth`)
  }

  /**
   * Aplicar Expose al enemigo
   */
  applyExpose(target) {
    // Rogue puede aplicar Expose con ciertos ataques
    target.addStatusEffect({
      type: 'expose',
      duration: 1, // Solo para el próximo ataque
      sourceClass: 'rogue'
    })
    
    console.log(`🎯 ${target.name} is exposed! Next attack against them will be critical!`)
    return true
  }

  // ==================== STEALTH/BACKSTAB CALCULATIONS ====================
  
  /**
   * Duración de stealth según nivel
   */
  getStealthDuration() {
    switch (this.level) {
      case 3: return 2  // 2 turnos
      case 4: return 2  // 2 turnos
      case 5: return 3  // 3 turnos (mejora en max level)
      default: return 2
    }
  }

  /**
   * Cooldown de stealth (se reduce con nivel)
   */
  getStealthCooldown() {
    switch (this.level) {
      case 3: return 6  // 6 turnos cooldown
      case 4: return 5  // 5 turnos cooldown
      case 5: return 4  // 4 turnos cooldown
      default: return 6
    }
  }

  /**
   * Cooldown de backstab
   */
  getBackstabCooldown() {
    switch (this.level) {
      case 3: return 4  // 4 turnos cooldown
      case 4: return 3  // 3 turnos cooldown
      case 5: return 3  // 3 turnos cooldown
      default: return 4
    }
  }

  /**
   * Daño bonus de backstab (+0.5% every 2-3 levels como dijiste)
   */
  getBackstabBonusDamage() {
    const baseAttack = this.baseAttack + this.getEquipmentAttackBonus()
    
    switch (this.level) {
      case 3: return Math.floor(baseAttack * 0.5)   // 50% bonus
      case 4: return Math.floor(baseAttack * 0.75)  // 75% bonus (+0.25%)
      case 5: return Math.floor(baseAttack * 1.0)   // 100% bonus (+0.25%)
      default: return Math.floor(baseAttack * 0.5)
    }
  }

  /**
   * Verificar si puede usar backstab
   */
  canBackstab() {
    return this.isStealthed && 
           this.cooldowns.backstab === 0 && 
           this.remainingMoves >= 2
  }

  // ==================== ROGUE TURN MANAGEMENT ====================
  
  /**
   * Override startTurn para manejar stealth timing
   */
  startTurn() {
    super.startTurn()
    
    // Reducir duración de stealth
    if (this.isStealthed && this.stealthTurnsLeft > 0) {
      this.stealthTurnsLeft--
      
      if (this.stealthTurnsLeft === 0) {
        this.exitStealth()
      }
    }
  }

  /**
   * Override levelUp para actualizar initiative bonus del Rogue
   */
  levelUp() {
    super.levelUp()
    
    // Rogue tiene mejor escalado de initiative
    this.baseInitiative = 15 + this.level * 3
    this.currentInitiative = this.baseInitiative
  }

  // ==================== ROGUE UTILITIES ====================
  
  /**
   * Override getStats para incluir info específica del Rogue
   */
  getStats() {
    const baseStats = super.getStats()
    
    return {
      ...baseStats,
      defenseType: 'dodge',
      dodgeChance: Math.floor(this.calculateDodgeChance() * 100),
      isStealthed: this.isStealthed,
      stealthTurnsLeft: this.stealthTurnsLeft,
      backstabReady: this.backstabReady,
      canBackstab: this.canBackstab(),
      initiative: this.baseInitiative
    }
  }

  /**
   * Override resetForCombat para resetear estado de stealth
   */
  resetForCombat() {
    super.resetForCombat()
    
    this.isStealthed = false
    this.stealthTurnsLeft = 0
    this.backstabReady = false
  }

  /**
   * Verificar si puede usar habilidades específicas
   */
  canUseStealth() {
    return !this.isStealthed && this.canPerformAction('elite')
  }

  /**
   * Verificar si es targeteable (para enemy AI)
   */
  isTargetable() {
    return !this.isStealthed
  }

  /**
   * Obtener info de stealth/backstab para UI
   */
  getStealthInfo() {
    return {
      canStealth: this.canUseStealth(),
      canBackstab: this.canBackstab(),
      isStealthed: this.isStealthed,
      stealthTurnsLeft: this.stealthTurnsLeft,
      stealthCooldown: this.cooldowns.stealth,
      backstabCooldown: this.cooldowns.backstab,
      backstabReady: this.backstabReady,
      bonusDamage: this.getBackstabBonusDamage()
    }
  }
}

export default Rogue;
