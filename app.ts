import Koa from "koa";
import HeroRouter from "@routes/hero";
import RestHeroRepo from "@repos/hero/rest";

const koa = new Koa();

const heroRepo = new RestHeroRepo({
  host: "https://hahow-recruit.herokuapp.com",
  port: "443",
});

const heroRouter = HeroRouter(heroRepo);

koa.use(heroRouter.routes());

export default koa;
