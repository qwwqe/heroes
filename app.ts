import Koa from "koa";
import HeroRouter from "@routes/hero";
import RestHeroRepo from "@repos/hero/rest";
import ErrorResponse from "@errors";

const koa = new Koa();

const globalErrorHandler: Parameters<typeof koa.use>[0] = async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.body = {
      code: "err.global.unknown",
      message: "未知錯誤",
    } as ErrorResponse;
  }
};

koa.use(globalErrorHandler);

const heroRepo = new RestHeroRepo({
  host: "https://hahow-recruit.herokuapp.com",
  port: "443",
});

const heroRouter = HeroRouter({ repo: heroRepo });

koa.use(heroRouter.routes());

export default koa;
