/**
 * Mage Class - Implementa todas las mecánicas específicas del Mage
 * Hereda de BaseClass y añade:
 * - Lightning Whip light attack 
 * - Ice Spikes heavy attack
 * - Mist Step defense (damage mitigation)
 * - Firestorm elite skill (area damage + burn effects)
 * - Chill, Shocked, Burn status effects
 */

import BaseClass from './BaseClass.js'

class Mage extends BaseClass {
  constructor(name = '') {
    super('mage', name)
    
    // Stats específicos del Mage (orientados a magic damage)
    this.maxHP = 90   // -10 HP base (más frágil)
    this.currentHP = 90
    this.defense = 6  // -4 DEF base (el más frágil)
    this.baseMagicPower = this.baseAttack  // Usar attack stat como magic power
    
    // Mage-specific cooldowns
    this.cooldowns.firestorm = 0    // Elite skill cooldown
    
    // Mage-specific tracking
    this.firestormActive = false    // Si Firestorm está activo
    this.firestormTurnsLeft = 0     // Duración del Firestorm
    this.mistStepCharges = 0        // Charges para Mist Step mejorado
  }

  // ==================== MAGE-SPECIFIC ATTACKS ====================
  
  /**
   * Light Attack - Lightning Whip
   * Ataque mágico con posibilidad de aplicar Shocked
   */
  lightAttack() {
    const result = super.lightAttack() // Usa la lógica base que ya maneja Shocked
    
    if (result.success) {
      result.message = `${this.name} lashes with lightning whip for ${result.damage} damage`
      result.attackType = 'lightning-whip'
      result.damageType = 'magical'
      
      // Lightning Whip puede aplicar Chill ocasionalmente
      if (Math.random() < 0.2) { // 20% chance
        result.chillApplied = true
        result.message += ` (crackling with frost)`
      }
    }
    
    return result
  }

  /**
   * Heavy Attack - Ice Spikes
   * Alto daño mágico con posibilidad de aplicar Chill
   */
  heavyAttack() {
    if (!this.canPerformAction('heavy')) {
      return { success: false, message: "Heavy attack on cooldown or cannot attack" }
    }
    
    this.useMove()
    this.cooldowns.heavy = 2
    this.cannotAttackNextTurn = true
    
    let damage = this.calculateHeavyDamage()
    
    // Ice Spikes tienen bonus de daño mágico
    const iceBonus = Math.floor(damage * 0.2) // +20% damage por ser mágico
    damage += iceBonus
    
    return {
      success: true,
      action: 'heavy',
      damage: damage,
      attackType: 'ice-spikes',
      damageType: 'magical',
      iceBonus: iceBonus,
      chillGuaranteed: true, // Ice Spikes siempre aplican chill
      message: `${this.name} conjures deadly ice spikes for ${damage} damage (cannot attack next turn)`
    }
  }

  // ==================== MAGE DEFENSE - MIST STEP ====================
  
  /**
   * Mist Step Defense - Mage-specific defense
   * Teleportación que otorga evasion y counter-attack potential
   */
  defend() {
    if (!this.canPerformAction('defend')) {
      return { success: false, message: "Cannot defend" }
    }
    
    this.useMove()
    this.isDefending = true
    this.mistStepCharges = Math.min(3, this.mistStepCharges + 1) // Ganar charges
    
    const evasionChance = this.calculateMistStepEvasion()
    
    return {
      success: true,
      action: 'defend',
      defenseType: 'mist-step',
      evasionChance: Math.floor(evasionChance * 100),
      charges: this.mistStepCharges,
      message: `${this.name} dissolves into mist (${Math.floor(evasionChance * 100)}% evasion, ${this.mistStepCharges} charges)`
    }
  }

  /**
   * Override damage mitigation para implementar Mist Step específico
   */
  calculateDefenseMitigation(incomingDamage) {
    if (!this.isDefending) return incomingDamage
    
    // Mist Step: Evasion chance + damage reduction
    const evasionChance = this.calculateMistStepEvasion()
    
    if (Math.random() < evasionChance) {
      // Evasión completa + counter-attack opportunity
      console.log(`🌫️ Complete evasion! Mist Step successful`)
      
      // Ganar extra charge por evasión perfecta
      this.mistStepCharges = Math.min(3, this.mistStepCharges + 1)
      
      return 0
    } else {
      // Evasión parcial basada en magic power
      const partialEvasion = Math.min(0.4, this.baseMagicPower / 60) // Max 40% reduction
      const mitigatedDamage = Math.floor(incomingDamage * (1 - partialEvasion))
      
      console.log(`🌫️ Partial mist form! ${Math.floor(partialEvasion * 100)}% damage reduced`)
      return Math.max(1, mitigatedDamage)
    }
  }

  /**
   * Calcular probabilidad de evasión completa con Mist Step
   */
  calculateMistStepEvasion() {
    // Base chance + magic power scaling + charges bonus
    const baseChance = 0.25  // 25% base
    const magicBonus = this.baseMagicPower / 120 // Scaling con magic power
    const chargesBonus = this.mistStepCharges * 0.05 // +5% per charge
    
    return Math.min(0.7, baseChance + magicBonus + chargesBonus) // Max 70% evasion
  }

  // ==================== FIRESTORM ELITE SKILL ====================
  
  /**
   * Firestorm Elite Skill - Mage's signature ability
   * Meteoritos de fuego que crean área de burning damage
   */
  eliteSkill() {
    if (!this.canPerformAction('elite')) {
      return { 
        success: false, 
        message: "Firestorm not available (level 3+, on cooldown, or insufficient moves)" 
      }
    }
    
    // Consume both moves
    this.remainingMoves = 0
    this.cooldowns.firestorm = this.getFirestormCooldown()
    
    // Activar Firestorm
    this.firestormActive = true
    this.firestormTurnsLeft = this.getFirestormDuration()
    
    // Calcular daño inicial
    const initialDamage = this.calculateFirestormDamage()
    
    return {
      success: true,
      action: 'elite',
      skillName: 'firestorm',
      initialDamage: initialDamage,
      duration: this.firestormTurnsLeft,
      message: `${this.name} summons devastating firestorm! ${initialDamage} damage now, burning continues for ${this.firestormTurnsLeft} turns`
    }
  }

  /**
   * Aplicar burning area effect después de Firestorm
   */
  applyFirestormBurn(target) {
    if (!this.firestormActive) return false
    
    // Burn damage según tu especificación: 12 base en level 3
    const burnDamage = this.calculateBurnDamage()
    
    target.addStatusEffect({
      type: 'burn',
      duration: 2, // 2 turnos de burn
      sourceClass: 'mage',
      damageScaling: burnDamage
    })
    
    console.log(`🔥 ${target.name} is caught in lingering flames for ${burnDamage} damage per turn!`)
    return true
  }

  /**
   * Aplicar Chill a enemigo con proc chance
   */
  applyChillToTarget(target) {
    // Override del método base para usar lógica específica del Mage
    if (this.chillProc(0.3)) { // 30% chance para Mage attacks
      // Aumentar cooldowns del target
      Object.keys(target.cooldowns).forEach(key => {
        if (target.cooldowns[key] > 0) {
          target.cooldowns[key]++
        }
      })
      
      target.addStatusEffect({
        type: 'chill',
        duration: 1,
        sourceClass: 'mage'
      })
      
      console.log(`❄️ ${target.name} is chilled! Abilities take +1 turn longer`)
      return true
    }
    
    return false
  }

  // ==================== FIRESTORM CALCULATIONS ====================
  
  /**
   * Calcular daño de Firestorm según tu especificación
   * Level 3: 72 (24*3), Level 4: 144 (72*2), Level 5: 288 (144*2)
   */
  calculateFirestormDamage() {
    switch (this.level) {
      case 3: return 72   // 24 * 3
      case 4: return 144  // 72 * 2
      case 5: return 288  // 144 * 2
      default: return 72
    }
  }

  /**
   * Calcular daño de Burn (area damage post-Firestorm)
   */
  calculateBurnDamage() {
    switch (this.level) {
      case 3: return 12   // Base burn damage
      case 4: return 24   // 12 * 2
      case 5: return 48   // 24 * 2
      default: return 12
    }
  }

  /**
   * Duración de Firestorm (2 base, hasta 4 en level alto)
   */
  getFirestormDuration() {
    switch (this.level) {
      case 3: return 2  // 2 turnos
      case 4: return 3  // 3 turnos
      case 5: return 4  // 4 turnos (max como dijiste)
      default: return 2
    }
  }

  /**
   * Cooldown de Firestorm (se reduce con nivel)
   */
  getFirestormCooldown() {
    switch (this.level) {
      case 3: return 6  // 6 turnos cooldown
      case 4: return 5  // 5 turnos cooldown  
      case 5: return 4  // 4 turnos cooldown
      default: return 6
    }
  }

  // ==================== MAGE TURN MANAGEMENT ====================
  
  /**
   * Override startTurn para manejar Firestorm timing
   */
  startTurn() {
    super.startTurn()
    
    // Procesar Firestorm activo
    if (this.firestormActive && this.firestormTurnsLeft > 0) {
      this.firestormTurnsLeft--
      
      if (this.firestormTurnsLeft === 0) {
        this.firestormActive = false
        console.log(`🔥 Firestorm dissipates`)
      } else {
        console.log(`🔥 Firestorm continues... ${this.firestormTurnsLeft} turns remaining`)
      }
    }
    
    // Decay mist step charges si no se usan
    if (this.mistStepCharges > 0 && !this.isDefending) {
      this.mistStepCharges = Math.max(0, this.mistStepCharges - 1)
    }
  }

  // ==================== MAGE STATUS EFFECT INTEGRATION ====================
  
  /**
   * Override lightAttack result para aplicar status effects
   */
  processAttackStatusEffects(target, attackResult) {
    if (!attackResult.success) return
    
    // Lightning Whip puede aplicar Chill
    if (attackResult.attackType === 'lightning-whip' && attackResult.chillApplied) {
      this.applyChillToTarget(target)
    }
    
    // Ice Spikes siempre aplican Chill
    if (attackResult.attackType === 'ice-spikes' && attackResult.chillGuaranteed) {
      this.applyChillToTarget(target)
    }
    
    // Si Firestorm está activo, aplicar burn
    if (this.firestormActive) {
      this.applyFirestormBurn(target)
    }
  }

  /**
   * Usar Mist Step charges para counter-attack
   */
  mistStepCounter() {
    if (this.mistStepCharges <= 0) return null
    
    this.mistStepCharges--
    
    const counterDamage = Math.floor(this.baseMagicPower * 0.6) // 60% magic power
    
    return {
      success: true,
      damage: counterDamage,
      type: 'mist-counter',
      message: `🌫️ Mist Step counter-attack for ${counterDamage} damage!`
    }
  }

  // ==================== MAGE UTILITIES ====================
  
  /**
   * Override getStats para incluir info específica del Mage
   */
  getStats() {
    const baseStats = super.getStats()
    
    return {
      ...baseStats,
      defenseType: 'mist-step',
      magicPower: this.baseMagicPower + this.getEquipmentAttackBonus(),
      evasionChance: Math.floor(this.calculateMistStepEvasion() * 100),
      mistStepCharges: this.mistStepCharges,
      firestormActive: this.firestormActive,
      firestormTurnsLeft: this.firestormTurnsLeft,
      shockedCount: this.combatTracking.lightAttacksCount % 3
    }
  }

  /**
   * Override resetForCombat para resetear estado mágico
   */
  resetForCombat() {
    super.resetForCombat()
    
    this.firestormActive = false
    this.firestormTurnsLeft = 0
    this.mistStepCharges = 0
  }

  /**
   * Verificar si puede usar habilidades específicas
   */
  canUseFirestorm() {
    return this.canPerformAction('elite')
  }

  /**
   * Verificar próximo Shocked proc
   */
  getShockedProgress() {
    const progress = this.combatTracking.lightAttacksCount % 3
    const nextProcIn = 3 - progress
    const willProcNext = nextProcIn === 1
    
    return {
      progress: progress,
      nextIn: nextProcIn,
      willProc: willProcNext
    }
  }

  /**
   * Obtener info de Firestorm para UI
   */
  getFirestormInfo() {
    return {
      available: this.canUseFirestorm(),
      cooldown: this.cooldowns.firestorm,
      active: this.firestormActive,
      turnsLeft: this.firestormTurnsLeft,
      damage: this.calculateFirestormDamage(),
      duration: this.getFirestormDuration(),
      burnDamage: this.calculateBurnDamage()
    }
  }

  /**
   * Obtener info de Mist Step para UI
   */
  getMistStepInfo() {
    return {
      charges: this.mistStepCharges,
      maxCharges: 3,
      evasionChance: Math.floor(this.calculateMistStepEvasion() * 100),
      canCounter: this.mistStepCharges > 0
    }
  }
}

export default Mage;
