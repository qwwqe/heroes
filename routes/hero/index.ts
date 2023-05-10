import HeroRepo from "@repos/hero";
import Router from "koa-router";
import { DetailedHeroResponse, HeroResponse } from "./responses";

interface HeroRouterState {
  repo: HeroRepo;
  auth?: {
    name: string;
    password: string;
  };
}

interface HeroRouterOptions {
  repo: HeroRepo;
}

type RouterMiddleware = Router.IMiddleware<HeroRouterState, object>;

/**
 *  將HeroRepo物件暴露於state。
 */
export const RepoMiddleware = (repo: HeroRepo): RouterMiddleware => {
  return async (ctx, next) => {
    ctx.state.repo = repo;
    await next();
  };
};

/**
 * 檢查進來請求是否帶著驗證標頭，並將其暴露於state。
 */
export const AuthMiddleware = (): RouterMiddleware => {
  return async (ctx, next) => {
    const name = ctx.header.name;
    const password = ctx.header.password;
    const detailed = typeof name === "string" && typeof password === "string";

    if (detailed) {
      ctx.state.auth = {
        name: detailed ? name : "",
        password: detailed ? password : "",
      };
    }

    await next();
  };
};

/**
 * 處理取得多筆的英雄基本資料的請求。
 */
export const GetHeroesRoute = (): RouterMiddleware => {
  return async (ctx, next) => {
    const options = ctx.state.auth
      ? { detailed: true, auth: ctx.state.auth }
      : undefined;

    const heroResult = await ctx.state.repo.getHeroes(options);

    if (heroResult.ok) {
      const Representer = ctx.state.auth ? DetailedHeroResponse : HeroResponse;
      const body = heroResult.data.map((h) => new Representer(h));

      ctx.status = 200;
      ctx.body = body;

      return await next();
    }

    // TODO: stub
    ctx.status = 500;
    ctx.body = "stub";

    await next();
  };
};

/**
 * 處理取得英雄基本資料的請求。
 *
 * @param idParamName 對應路徑的參數名稱。預設值為"id"。
 */
export const GetHeroRoute = (idParamName = "id"): RouterMiddleware => {
  return async (ctx, next) => {
    const id = ctx.params[idParamName];

    const options = ctx.state.auth
      ? { detailed: true, auth: ctx.state.auth }
      : undefined;

    const heroResult = await ctx.state.repo.getHero(id, options);

    if (heroResult.ok) {
      const Representer = ctx.state.auth ? HeroResponse : DetailedHeroResponse;

      ctx.status = 200;
      ctx.body = new Representer(heroResult.data);

      return await next();
    }

    // TODO: stub
    ctx.status = 500;
    ctx.body = "stub";

    await next();
  };
};

const router = (options: HeroRouterOptions) => {
  const _router = new Router<HeroRouterState>({ prefix: "/heroes" });

  _router.use(RepoMiddleware(options.repo));

  _router.use(AuthMiddleware());

  _router.get("/", GetHeroesRoute());

  _router.get("/:id", GetHeroRoute("id"));

  return _router;
};

export default router;
