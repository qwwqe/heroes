import { RepoResult } from "@repos/base";
import HeroRepo, { GetHeroesOptions, GetHeroOptions, HeroAuthOptions } from ".";
import Hero from "@models/hero";
import Profile from "@models/profile";
import { RepoErrorCode } from "@repos/base/errors";

export interface RestHeroRepoOptions {
  host?: string;
  port?: string;
  fetcher?: typeof fetch;
}

interface AuthRequestBody {
  name: string;
  password: string;
}

interface HeroInfoResponseBody {
  id: string;
  name: string;
  image: string;
}

interface HeroProfileResponseBody {
  str: number;
  int: number;
  agi: number;
  luk: number;
}

class RestHeroRepo implements HeroRepo {
  host = "";

  port = "80";

  fetcher: typeof fetch = fetch;

  private get baseUrl(): URL {
    return new URL(`${this.host}:${this.port}`);
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
   * @todo 處理後台部份錯誤回200這件事
   */
  async authenticate(options: HeroAuthOptions): RepoResult<void> {
    const resource = new URL("auth", this.baseUrl);
    const body: AuthRequestBody = {
      name: options.name,
      password: options.password,
    };
    const headers = new Headers({ "Content-Type": "application/json" });

    const res = await this.fetcher(resource, {
      method: "POST",
      body: JSON.stringify(body),
      headers,
    });
    const content = await res.text();

    switch (res.status) {
      case 200:
        return { ok: true };
      case 400:
        return { ok: false, code: "err.repo.client", message: content };
      case 401:
        return { ok: false, code: "err.repo.auth", message: content };
      default:
        return { ok: false, code: "err.repo.unknown", message: content };
    }
  }

  async open(): RepoResult<void> {
    return { ok: true };
  }

  async close(): RepoResult<void> {
    return { ok: true };
  }

  getHeroes(options?: GetHeroesOptions): RepoResult<Hero[]> {
    throw new Error("stub" + options);
  }

  /**
   * @todo 處理後台部份錯誤回200這件事
   */
  async getHeroInfo(id: string): RepoResult<Hero> {
    const slug = encodeURIComponent(id);
    const resource = new URL(`heroes/${slug}`, this.baseUrl);
    const headers = new Headers({ "Content-Type": "application/json" });

    const res = await this.fetcher(resource, { method: "GET", headers });
    const contentType = res.headers.get("content-type") || "";

    const failureCode: RepoErrorCode =
      res.status === 404 ? "err.repo.notfound" : "err.repo.unknown";

    if (
      res.status === 200 &&
      contentType.split(";").includes("application/json")
    ) {
      const rawResponseBody = await res.json();

      if (
        "id" in rawResponseBody &&
        "name" in rawResponseBody &&
        "image" in rawResponseBody &&
        Object.getOwnPropertyNames(rawResponseBody).length === 3
      ) {
        const content: HeroInfoResponseBody = rawResponseBody;
        return { ok: true, data: new Hero(content) };
      }

      console.warn("未知回應： ", rawResponseBody);

      return { ok: false, code: failureCode, message: "未知錯誤" };
    }

    const message = await res.text();
    console.warn("未知回應：", message);

    return { ok: false, code: failureCode, message: "未知錯誤" };
  }

  /**
   * @todo 處理後台部份錯誤回200這件事
   */
  async getHeroProfile(id: string): RepoResult<Profile> {
    const slug = encodeURIComponent(id);
    const resource = new URL(`heroes/${slug}/profile`, this.baseUrl);
    const headers = new Headers({ "Content-Type": "application/json" });

    const res = await this.fetcher(resource, { method: "GET", headers });
    const contentType = res.headers.get("content-type") || "";

    const failureCode: RepoErrorCode =
      res.status === 404 ? "err.repo.notfound" : "err.repo.unknown";

    if (
      res.status === 200 &&
      contentType.split(";").includes("application/json")
    ) {
      const rawResponseBody = await res.json();
      console.log("raw profile:", rawResponseBody);

      if (
        "str" in rawResponseBody &&
        "agi" in rawResponseBody &&
        "int" in rawResponseBody &&
        "luk" in rawResponseBody &&
        Object.getOwnPropertyNames(rawResponseBody)
      ) {
        const content: HeroProfileResponseBody = rawResponseBody;

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

      const message = await res.text();
      console.warn("未知回應：", message);

      return { ok: false, code: failureCode, message: "未知錯誤" };
    }

    const message = await res.text();

    return { ok: false, code: failureCode, message };
  }

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
