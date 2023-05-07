/**
 * {@link Profile}建構子的初始參數。
 *
 * 未提供的屬性將設定為預設值。
 */
export interface ProfileOptions {
  strength?: number;
  intelligence?: number;
  agility?: number;
  luck?: number;
}

/**
 * 角色的基本能力值。一般而言，此類別不會單獨使用，而是嵌入於其他角色類別之中（如*Hero*)。
 *
 * @see [Hero](../models/hero)
 */
class Profile {
  /**
   * 角色的力量值。
   */
  strength = 0;

  /**
   * 角色的智力值。
   */
  intelligence = 0;

  /**
   * 角色的敏捷值。
   */
  agility = 0;

  /**
   * 角色的運氣值。
   */
  luck = 0;

  constructor(options?: ProfileOptions) {
    if (!options) {
      return;
    }

    this.strength = options.strength ?? this.strength;
    this.intelligence = options.intelligence ?? this.intelligence;
    this.agility = options.agility ?? this.agility;
    this.luck = options.luck ?? this.luck;
  }
}

export default Profile;
