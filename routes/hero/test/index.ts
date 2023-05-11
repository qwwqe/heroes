import test from "node:test";
import assert from "assert";
import { GetHeroRoute } from "..";
import Hero from "@models/hero";
import { DetailedHeroResponse, HeroResponse } from "../responses";
import { RepoFailure } from "@repos/base";

test("Hero Route", async (t) => {
  const Context = ({
    hero = new Hero(),
    detailed,
    slugKey = "id",
    slugValue = 1,
    getHero = () => ({ ok: true, data: hero }),
  }: {
    hero?: Hero;
    detailed?: boolean;
    slugKey?: string;
    slugValue?: any;
    getHero?: any;
  }) => {
    const state: { [s: string]: any } = {};

    if (detailed) {
      state.auth = { name: "foo", bar: "foo" };
    }

    state.repo = { getHero };

    const params = { [slugKey]: slugValue };

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

    await t.test("successful use of custom slug", async () => {
      const slugKey = "foo";
      const slugValue = "bar";
      let internalSlugValue = "";
      const route: any = GetHeroRoute(slugKey);
      const hero = new Hero();
      const ctx = Context({
        slugKey,
        slugValue,
        getHero: (v: any) => {
          internalSlugValue = v;
          return { ok: true, data: hero };
        },
      });

      const next = () => null;

      await route(ctx, next);

      assert.equal(slugValue, internalSlugValue);
    });

    await t.test("unsuccessful fetch returns correct error", async () => {
      const route: any = GetHeroRoute();
      const error: RepoFailure = {
        ok: false,
        code: "err.repo.hero.auth",
        message: "GG",
      };
      const ctx = Context({
        getHero: () => error,
      });

      const next = () => null;

      await route(ctx, next);

      assert.equal(ctx.state.error, error);
    });
  });
});
