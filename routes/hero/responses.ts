import Hero from "@models/hero";

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
