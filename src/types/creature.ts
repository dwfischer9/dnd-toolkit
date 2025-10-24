export default interface Creature {
  id: string
  name: string
  ac: number
  maxHp: number
  currentHp: number
  initiative: number
  isActive?: boolean
  isPlayer?: boolean
  image?: string
}

// Optional: You might want to add additional creature-related types
export interface CreatureStats {
  strength: number
  dexterity: number
  constitution: number
  intelligence: number
  wisdom: number
  charisma: number
}

export interface CreatureSaves {
  strength?: boolean
  dexterity?: boolean
  constitution?: boolean
  intelligence?: boolean
  wisdom?: boolean
  charisma?: boolean
}

// API response types that match the actual D&D 5e API structure
export interface ApiCreature {
  index: string
  name: string
  size: 'Tiny' | 'Small' | 'Medium' | 'Large' | 'Huge' | 'Gargantuan'
  type: string
  alignment: string
  armor_class: Array<{
    type: string
    value: number
  }> | number
  hit_points: number
  hit_dice?: string
  hit_points_roll?: string
  speed: {
    walk?: string
    fly?: string
    swim?: string
    burrow?: string
    climb?: string
  }
  strength: number
  dexterity: number
  constitution: number
  intelligence: number
  wisdom: number
  charisma: number
  proficiencies?: Array<{
    value: number
    proficiency: {
      index: string
      name: string
      url: string
    }
  }>
  damage_vulnerabilities: string[]
  damage_resistances: string[]
  damage_immunities: string[]
  condition_immunities: string[]
  senses: {
    blindsight?: string
    darkvision?: string
    tremorsense?: string
    truesight?: string
    passive_perception: number
  }
  languages: string
  challenge_rating: number
  proficiency_bonus: number
  xp: number
  special_abilities: SpecialAbility[]
  actions: Action[]
  legendary_actions: LegendaryAction[]
  image?: string
  url: string
  updated_at: string
  forms: any[]
  reactions: any[]
}

// Extended creature interface for more detailed combat tracking
export interface DetailedCreature extends Creature {
  stats?: CreatureStats
  saves?: CreatureSaves
  speed?: {
    walk?: string
    fly?: string
    swim?: string
    burrow?: string
    climb?: string
  }
  size?: 'tiny' | 'small' | 'medium' | 'large' | 'huge' | 'gargantuan'
  type?: string
  alignment?: string
  challengeRating?: number
  proficiencyBonus?: number
  damage_vulnerabilities?: string[]
  damage_resistances?: string[]
  damage_immunities?: string[]
  condition_immunities?: string[]
  languages?: string
  legendary_actions?: LegendaryAction[]
}

export interface SpecialAbility {
  name: string
  desc: string
  usage?: {
    type: string
    times?: number
    dice?: string
    min_value?: number
    rest_types?: string[]
  }
  dc?: {
    dc_type: {
      index: string
      name: string
      url: string
    }
    dc_value: number
    success_type: string
  }
  damage: DamageInfo[]
}

export interface DamageInfo {
  damage_type: {
    index: string
    name: string
    url: string
  }
  damage_dice: string
}

export interface LegendaryAction {
  name: string
  desc: string
  damage: DamageInfo[]
  dc?: {
    dc_type: {
      index: string
      name: string
      url: string
    }
    dc_value: number
    success_type: string
  }
}

export interface Action {
  name: string
  desc: string
  attack_bonus?: number
  damage: DamageInfo[]
  dc?: {
    dc_type: {
      index: string
      name: string
      url: string
    }
    dc_value: number
    success_type: string
  }
  usage?: {
    type: string
    dice?: string
    min_value?: number
    rest_types?: string[]
  }
  multiattack_type?: string
  actions?: Array<{
    action_name: string
    count: string
    type: string
  }>
}
