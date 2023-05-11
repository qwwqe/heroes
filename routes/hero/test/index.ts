import test from "node:test";
import assert from "assert";
import { GetHeroRoute } from "..";
import Hero from "@models/hero";
import { DetailedHeroResponse, HeroResponse } from "../responses";

test("Hero Route", async (t) => {
  const Context = ({ hero, detailed }: { hero: Hero; detailed?: boolean }) => {
    const state: { [s: string]: any } = {};

    if (detailed) {
      state.auth = { name: "foo", bar: "foo" };
    }

    state.repo = { getHero: () => ({ ok: true, data: hero }) };

    const params = { id: 1 };

    return { state, params } as { [s: string]: any };
  };

  await t.test("GetHeroRoute", async (t) => {
    await t.test("successful fetch of non-detailed hero", async () => {
      const route: any = GetHeroRoute();
      const hero = new Hero();
      const ctx = Context({ hero, detailed: false });

      const next = () => null;

      await route(ctx, next);

      assert.equal(ctx.status, 200);

      assert.ok(ctx.body instanceof HeroResponse);

      assert.equal(ctx.body.hero, hero);
    });

    await t.test("successful fetch of detailed hero", async () => {
      const route: any = GetHeroRoute();
      const hero = new Hero();
      const ctx = Context({ hero, detailed: true });

      const next = () => null;

      await route(ctx, next);

      assert.equal(ctx.status, 200);

      assert.ok(ctx.body instanceof DetailedHeroResponse);

      assert.equal(ctx.body.hero, hero);
    });
  });
});
