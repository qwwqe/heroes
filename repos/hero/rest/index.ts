import { RepoResult } from "@repos/base";
import HeroRepo, {
  GetHeroesOptions,
  GetHeroOptions,
  HeroAuthOptions,
} from "@repos/hero";
import Hero from "@models/hero";
import Profile from "@models/profile";

import validator from "@validator";
import InfoResponseSchema from "./schemas/info_response.json";
import ProfileResponseSchema from "./schemas/profile_response.json";

export interface RestHeroRepoOptions {
  host?: string;
  port?: string;
  fetcher?: typeof fetch;
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

interface ProfileResponse {
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
    const content = await res.text().catch(() => "");

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

  async getHeroInfo(id: string): RepoResult<Hero> {
    const slug = encodeURIComponent(id);
    const resource = new URL(`heroes/${slug}`, this.baseUrl);
    const headers = new Headers({
      "Content-Type": "application/json",
      Accept: "application/json",
    });
    const res = await this.fetcher(resource, { method: "GET", headers });

    if (res.status !== 200) {
      const message = await res.text().catch(() => "");
      console.warn(
        `[${res.status}] 未知回應來自"${resource.toString()}": `,
        message
      );

      return {
        ok: false,
        code: res.status === 404 ? "err.repo.notfound" : "err.repo.unknown",
        message: "未知錯誤",
      };
    }

    const content = await res.json().catch(() => ({}));
    const validate = validator<InfoResponse>(InfoResponseSchema);

    if (!validate(content)) {
      console.warn(
        `[${res.status}] 未知回應來自"${resource.toString()}": `,
        content
      );
      return { ok: false, code: "err.repo.unknown", message: "未知錯誤" };
    }

    return { ok: true, data: new Hero(content) };
  }

  async getHeroProfile(id: string): RepoResult<Profile> {
    const slug = encodeURIComponent(id);
    const resource = new URL(`heroes/${slug}/profile`, this.baseUrl);
    const headers = new Headers({
      "Content-Type": "application/json",
      Accept: "application/json",
    });
    const res = await this.fetcher(resource, { method: "GET", headers });

    if (res.status !== 200) {
      const message = await res.text().catch(() => "");
      console.warn(
        `[${res.status}] 未知回應來自"${resource.toString()}": `,
        message
      );

      return {
        ok: false,
        code: res.status === 404 ? "err.repo.notfound" : "err.repo.unknown",
        message: "未知錯誤",
      };
    }

    const content = await res.json().catch(() => ({}));
    const validate = validator<ProfileResponse>(ProfileResponseSchema);

    if (!validate(content)) {
      console.warn(
        `[${res.status}] 未知回應來自"${resource.toString()}": `,
        content
      );
      return { ok: false, code: "err.repo.unknown", message: "未知錯誤" };
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
