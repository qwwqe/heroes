import Router from "koa-router";

const router = new Router({
  prefix: "/heroes",
});

router.get("/", (ctx, next) => {
  ctx.body = "測試";
  return next();
});

router.get("/:id", (ctx, next) => {
  ctx.body = `測試：${ctx.params.id}`;
  return next();
});

export default router;
