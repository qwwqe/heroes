import Profile, { ProfileOptions } from "@models/profile";

/**
 * {@link Hero}建構子的初始參數。
 *
 * 未提供的屬性將設定為預設值。
 */
export interface HeroOptions {
  id?: string;
  name?: string;
  image?: string;
  profile?: ProfileOptions;
}

/**
 * 英雄角色的基本資料。
 */
class Hero {
  /**
   * 英雄的ID。
   */
  id = "";

  /**
   * 英雄的名子。
   */
  name = "";

  /**
   * 英雄的大頭照。此屬性的格式應當符合RFC1738所定義的URL格式。
   */
  image = "";

  /**
   * 英雄的基本能力值。
   */
  profile = new Profile();

  constructor(options?: HeroOptions) {
    if (!options) {
      return;
    }

    this.id = options.id ?? this.id;
    this.name = options.name ?? this.name;
    this.image = options.image ?? this.image;

    if (options.profile) {
      this.profile = new Profile(options.profile);
    }
  }
}

export default Hero;
