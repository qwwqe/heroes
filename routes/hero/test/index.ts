import test from "node:test";
import assert from "assert";
import { GetHeroRoute, GetHeroesRoute } from "..";
import Hero from "@models/hero";
import { DetailedHeroResponse, HeroResponse } from "../responses";
import { RepoFailure } from "@repos/base";

test("Hero Route", async (t) => {
  await t.test("GetHeroRoute", async (t) => {
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

    await t.test("repo exceptions bubble up", async () => {
      const route: any = GetHeroRoute();
      const message = "bubble";
      const ctx = Context({
        getHero: () => {
          throw new Error(message);
        },
      });

      const next = () => null;

      assert.rejects(route(ctx, next));
    });
  });

  await t.test("GetHeroesRoute", async (t) => {
    const Context = ({
      heroes = [new Hero()],
      detailed,
      slugKey = "id",
      slugValue = 1,
      getHeroes = () => ({ ok: true, data: heroes }),
    }: {
      heroes?: Hero[];
      detailed?: boolean;
      slugKey?: string;
      slugValue?: any;
      getHeroes?: any;
    }) => {
      const state: { [s: string]: any } = {};

      if (detailed) {
        state.auth = { name: "foo", bar: "foo" };
      }

      state.repo = { getHeroes };

      const params = { [slugKey]: slugValue };

      return { state, params } as { [s: string]: any };
    };

    await t.test("successful fetch of non-detailed heroes", async () => {
      const route: any = GetHeroesRoute();
      const heroes = [new Hero()];
      const ctx = Context({ heroes, detailed: false });

      const next = () => null;

      await route(ctx, next);

      assert.equal(ctx.status, 200);

      assert.ok(Array.isArray(ctx.body));

      assert.ok(ctx.body.every((b) => b instanceof HeroResponse));

      assert.ok(ctx.body.every((b, i) => b.hero === heroes[i]));
    });

    await t.test("successful fetch of detailed heroes", async () => {
      const route: any = GetHeroesRoute();
      const heroes = [new Hero()];
      const ctx = Context({ heroes, detailed: true });

      const next = () => null;

      await route(ctx, next);

      assert.equal(ctx.status, 200);

      assert.ok(Array.isArray(ctx.body));

      assert.ok(ctx.body.every((b) => b instanceof DetailedHeroResponse));

      assert.ok(ctx.body.every((b, i) => b.hero === heroes[i]));
    });

    await t.test("unsuccessful fetch returns correct error", async () => {
      const route: any = GetHeroesRoute();
      const error: RepoFailure = {
        ok: false,
        code: "err.repo.hero.auth",
        message: "GG",
      };
      const ctx = Context({
        getHeroes: () => error,
      });

      const next = () => null;

      await route(ctx, next);

      assert.equal(ctx.state.error, error);
    });

    await t.test("repo exceptions bubble up", async () => {
      const route: any = GetHeroesRoute();
      const message = "bubble";
      const ctx = Context({
        getHeroes: () => {
          throw new Error(message);
        },
      });

      const next = () => null;

      assert.rejects(route(ctx, next));
    });
  });
});
