import Koa from "koa";
import HeroRouter from "@routes/hero";

const koa = new Koa();

koa.use(HeroRouter.routes());

export default koa;
