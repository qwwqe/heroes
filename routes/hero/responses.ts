import { ErrorMessage } from "@errors";
import Hero from "@models/hero";
import { HeroRepoErrorCode } from "@repos/hero/errors";

/**
 * 基本英雄資料的回應結構。
 */
export class HeroResponse {
  hero: Hero;

  constructor(hero: Hero) {
    this.hero = hero;
  }

  toJSON() {
    return {
      id: this.hero.id,
      name: this.hero.name,
      image: this.hero.image,
    };
  }
}

/**
 * 詳細英雄資料的回應結構。
 */
export class DetailedHeroResponse extends HeroResponse {
  toJSON() {
    return {
      ...super.toJSON(),
      profile: {
        str: this.hero.profile.strength,
        int: this.hero.profile.intelligence,
        luk: this.hero.profile.luck,
        agi: this.hero.profile.agility,
      },
    };
  }
}

/**
 * 英雄repo的錯誤回應結構。
 */
export class ErrorResponse {
  code: HeroRepoErrorCode;

  constructor(code: HeroRepoErrorCode) {
    this.code = code;
  }

  toJSON() {
    return {
      message: ErrorMessage[this.code],
      code: this.code,
    };
  }
}
