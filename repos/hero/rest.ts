import { RepoResult } from "@repos/base";
import HeroRepo, { GetHeroesOptions, GetHeroOptions, HeroAuthOptions } from ".";
import Hero from "@models/hero";

export interface RestHeroRepoOptions {
  host?: string;
  port?: string;
  fetcher?: typeof fetch;
}

interface AuthRequestBody {
  name: string;
  password: string;
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

  getHero(id: string, options?: GetHeroOptions): RepoResult<Hero> {
    throw new Error("stub" + options + id);
  }
}

export default RestHeroRepo;
