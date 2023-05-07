import BaseRepo, { RepoResult } from "@repos/base";
import Hero from "@models/hero";

/**
 * 驗證請求的參數。
 */
export interface HeroAuthOptions {
  name: string;
  password: string;
}

/**
 * 資料選項。
 *
 * @todo 補充說明。
 */
export type GetHeroesOptions =
  | { detailed: false }
  | {
      detailed: true;
      auth: HeroAuthOptions;
    };

/**
 * 資料選項。請見{@link GetHeroesOptions}。
 */
export type GetHeroOptions = GetHeroesOptions;

/**
 * 存取英雄資料的repository介面。
 */
interface HeroRepo extends BaseRepo {
  /**
   * 取得多筆英雄資料。
   *
   * @todo 補充說明
   */
  getHeroes(options?: GetHeroesOptions): RepoResult<Hero[]>;

  /**
   * 取得單筆英雄資料。
   *
   * @todo 補充說明
   */
  getHero(id: string, options?: GetHeroOptions): RepoResult<Hero>;
}

export default HeroRepo;
