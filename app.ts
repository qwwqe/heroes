import Koa from "koa";
import Logger from "koa-logger";
import HeroRouter from "@routes/hero";
import RestHeroRepo from "@repos/hero/rest";
import ErrorResponse from "@errors";

const koa = new Koa();
koa.use(Logger());

/**
 * 改Koa預設404回應的Middleware。
 */
const Global404Handler: Parameters<typeof koa.use>[0] = async (ctx, next) => {
  await next();

  if (ctx.status === 404 && typeof ctx.body !== "object") {
    ctx.status = 404;
    ctx.body = {
      code: "err.global.notfound",
      message: "查無資料",
    } as ErrorResponse;
  }
};

koa.use(Global404Handler);

/**
 * 確保所有錯誤回應有明確結構的Middleware。
 */
const GlobalErrorHandler: Parameters<typeof koa.use>[0] = async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.body = {
      code: "err.global.unknown",
      message: "未知錯誤",
    } as ErrorResponse;
    ctx.status = 500;
  }
};

koa.use(GlobalErrorHandler);

const heroRepo = new RestHeroRepo({
  host: "https://hahow-recruit.herokuapp.com",
  port: "443",
});

const heroRouter = HeroRouter({ repo: heroRepo });

koa.use(heroRouter.routes());

export default koa;
