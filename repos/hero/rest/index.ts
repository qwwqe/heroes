import { RepoFailure, RepoResult } from "@repos/base";
import HeroRepo, {
  GetHeroesOptions,
  GetHeroOptions,
  HeroAuthOptions,
} from "@repos/hero";
import Hero from "@models/hero";
import Profile from "@models/profile";

import Validator, { RegisterSchema } from "@validator";
import InfoResponseSchema from "./schemas/info_response.json";
import BatchInfoResponseSchema from "./schemas/batch_info_response.json";
import ProfileResponseSchema from "./schemas/profile_response.json";
import MysteryErrorSchema from "./schemas/mystery_error_response.json";

import { Fetcher, ThrottledFetcher } from "./fetcher";

export interface RestHeroRepoOptions {
  host?: string;
  port?: string;
  fetcher?: Fetcher;
  mysteryErrorRetries?: number;
}

interface AuthRequestBody {
  name: string;
  password: string;
}

interface InfoResponse {
  id: string;
  name: string;
  image: string;
}
RegisterSchema<InfoResponse>(InfoResponseSchema);

type BatchInfoResponse = InfoResponse[];
RegisterSchema<BatchInfoResponse>(BatchInfoResponseSchema);

interface ProfileResponse {
  str: number;
  int: number;
  agi: number;
  luk: number;
}
RegisterSchema<ProfileResponse>(ProfileResponseSchema);

type MysteryErrorResponse = {
  code: 1000;
  message: "Backend error";
};
RegisterSchema<MysteryErrorResponse>(MysteryErrorSchema);

const RestHeroRepoError = (status: number): Awaited<RepoFailure> => ({
  ok: false,
  code: status === 404 ? "err.repo.hero.notfound" : "err.repo.hero.unknown",
  message: "未知錯誤",
});

/**
 * TODO: 改用真正的logger套件
 */
const UnknownResponseLogger = (
  status: string | number,
  resource: string | URL,
  message: string
) => {
  console.warn(
    `[WARN] [${status}] 未知回應來自${resource.toString()}: ${message}`
  );
};

/**
 * REST後台資料來源的HeroRepo實作。
 */
class RestHeroRepo implements HeroRepo {
  /**
   * 後台的主機名稱。
   */
  host = "";

  /**
   * 後台的通訊埠。
   */
  port = "80";

  /**
   * 負責獲取外部HTTP資源的實體。
   */
  fetcher: Fetcher = new ThrottledFetcher();

  /**
   * 遇到後台{@link MysteryErrorResponse}時，該重試的次數。目前只用於{@link getHeroInfo}。
   */
  mysteryErrorRetries = 5;

  /**
   * 完整的外部網址。
   */
  private get baseUrl(): URL {
    return new URL(`${this.host}:${this.port}`);
  }

  /**
   * {@link fetcher}.fetch的別名。
   */
  private get fetch(): typeof fetch {
    return this.fetcher.fetch.bind(this.fetcher);
  }

  constructor(options?: RestHeroRepoOptions) {
    if (!options) {
      return;
    }

    this.host = options.host ?? this.host;
    this.port = options.port ?? this.port;
    this.fetcher = options.fetcher ?? this.fetcher;
  }

  /**
   * 驗證於後台API。
   */
  async authenticate(options: HeroAuthOptions): RepoResult<void> {
    const resource = new URL("auth", this.baseUrl);
    const body: AuthRequestBody = {
      name: options.name,
      password: options.password,
    };
    const headers = new Headers({ "Content-Type": "application/json" });

    const res = await this.fetch(resource, {
      method: "POST",
      body: JSON.stringify(body),
      headers,
    });
    const content = await res.text().catch(() => "");

    switch (res.status) {
      case 200:
        return { ok: true };
      case 400:
        return { ok: false, code: "err.repo.hero.client", message: content };
      case 401:
        return { ok: false, code: "err.repo.hero.auth", message: content };
      default:
        return { ok: false, code: "err.repo.hero.unknown", message: content };
    }
  }

  /**
   * 啟動repo。目前不執行任何操作。
   */
  async open(): RepoResult<void> {
    return { ok: true };
  }

  /**
   * 關閉repo。目前不執行任何操作。
   */
  async close(): RepoResult<void> {
    return { ok: true };
  }

  /**
   * 取得英雄的基本資料。回傳的Hero當中，profile屬性會是空的。
   */
  async getHeroesInfo(): RepoResult<Hero[]> {
    const resource = new URL("heroes", this.baseUrl);
    const headers = new Headers({
      "Content-Type": "application/json",
      Accept: "application/json",
    });
    const res = await this.fetch(resource, { method: "GET", headers });

    if (res.status !== 200) {
      const message = await res.text().catch(() => "");
      UnknownResponseLogger(res.status, resource, message);
      return RestHeroRepoError(res.status);
    }

    const content = await res.json().catch(() => ({}));
    const validate = Validator<BatchInfoResponse>(BatchInfoResponseSchema);

    if (!validate(content)) {
      UnknownResponseLogger(res.status, resource, content);
      return { ok: false, code: "err.repo.hero.unknown", message: "未知錯誤" };
    }

    return { ok: true, data: content.map((ir) => new Hero(ir)) };
  }

  /**
   * 取得多筆的英雄資料。
   */
  async getHeroes(options?: GetHeroesOptions): RepoResult<Hero[]> {
    if (options?.detailed) {
      const authResult = await this.authenticate(options.auth);

      if (!authResult.ok) {
        return authResult;
      }
    }

    const heroInfoResult = await this.getHeroesInfo();

    if (!heroInfoResult.ok || !options?.detailed) {
      return heroInfoResult;
    }

    const heroes = heroInfoResult.data;
    const heroPromises = heroes.map((h) => this.getHeroProfile(h.id));
    const settledPromises = await Promise.all(heroPromises);

    for (let i = 0; i < settledPromises.length; i++) {
      const heroProfileResult = settledPromises[i];

      if (!heroProfileResult.ok) {
        return heroProfileResult;
      }

      heroes[i].profile = heroProfileResult.data;
    }

    return { ok: true, data: heroes };
  }

  /**
   * 遇到後台{@link MysteryErrorResponse}時，嘗試再次送出請求。目前只用於{@link getHeroInfo}。
   */
  private async fetchWithRetry(
    ...args: Parameters<typeof this.fetch>
  ): ReturnType<typeof this.fetch> {
    let res = await this.fetch(...args);

    const validateMystery = Validator<MysteryErrorResponse>(MysteryErrorSchema);

    for (let i = 0; i < this.mysteryErrorRetries && res.status === 200; i++) {
      const mysteryContent = await res.clone().json().catch();

      if (!validateMystery(mysteryContent)) {
        break;
      }

      res = await this.fetch(...args);
    }

    return res;
  }

  /**
   * 取得英雄的基本資料。
   */
  async getHeroInfo(id: string): RepoResult<Hero> {
    const slug = encodeURIComponent(id);
    const resource = new URL(`heroes/${slug}`, this.baseUrl);
    const headers = new Headers({
      "Content-Type": "application/json",
      Accept: "application/json",
    });

    const res = await this.fetchWithRetry(resource, { method: "GET", headers });

    if (res.status !== 200) {
      const message = await res.text().catch(() => "");
      UnknownResponseLogger(res.status, resource, message);
      return RestHeroRepoError(res.status);
    }

    const content = await res.json().catch();
    const validate = Validator<InfoResponse>(InfoResponseSchema);

    if (!validate(content)) {
      UnknownResponseLogger(res.status, resource, content);
      return { ok: false, code: "err.repo.hero.unknown", message: "未知錯誤" };
    }

    return { ok: true, data: new Hero(content) };
  }

  /**
   * 取得英雄的能力值。
   */
  async getHeroProfile(id: string): RepoResult<Profile> {
    const slug = encodeURIComponent(id);
    const resource = new URL(`heroes/${slug}/profile`, this.baseUrl);
    const headers = new Headers({
      "Content-Type": "application/json",
      Accept: "application/json",
    });
    const res = await this.fetch(resource, { method: "GET", headers });

    if (res.status !== 200) {
      const message = await res.text().catch(() => "");
      UnknownResponseLogger(res.status, resource, message);
      return RestHeroRepoError(res.status);
    }

    const content = await res.json().catch();
    const validate = Validator<ProfileResponse>(ProfileResponseSchema);

    if (!validate(content)) {
      UnknownResponseLogger(res.status, resource, content);
      return { ok: false, code: "err.repo.hero.unknown", message: "未知錯誤" };
    }

    return {
      ok: true,
      data: new Profile({
        strength: content.str,
        agility: content.agi,
        intelligence: content.int,
        luck: content.luk,
      }),
    };
  }

  /**
   * 取得英雄資料。
   */
  async getHero(id: string, options?: GetHeroOptions): RepoResult<Hero> {
    if (options?.detailed) {
      const authResult = await this.authenticate(options.auth);

      if (!authResult.ok) {
        return authResult;
      }
    }

    const heroInfoResult = await this.getHeroInfo(id);

    if (!heroInfoResult.ok || !options?.detailed) {
      return heroInfoResult;
    }

    const heroProfileResult = await this.getHeroProfile(id);

    if (!heroProfileResult.ok) {
      return heroProfileResult;
    }

    const hero = heroInfoResult.data;
    hero.profile = heroProfileResult.data;

    return { ok: true, data: hero };
  }
}

export default RestHeroRepo;
