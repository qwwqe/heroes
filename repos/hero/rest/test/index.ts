import test from "node:test";
import assert from "assert";
import RestHeroRepo from "..";
import { Fetcher } from "../fetcher";

test("RestHeroRepo", async (t) => {
  /**
   * @todo 考慮簡化mock——畢竟我們要測試的純粹是authenticate
   * 怎麼處理遠端的各種回傳，而不是有沒有正確地建構請求物件吧。
   */
  await t.test("authenticate", async (t) => {
    const fetcher: Fetcher = {
      fetch: async (_, init) => {
        if (!init?.body) {
          return new Response("", { status: 500 });
        }

        const o = JSON.parse(init.body.toString());

        if (
          !("name" in o) ||
          !("password" in o) ||
          Object.getOwnPropertyNames(o).length !== 2
        ) {
          return new Response("無效格式", { status: 400 });
        }

        if (o.name !== "hahow" || o.password !== "rocks") {
          return new Response("驗證失敗", { status: 401 });
        }

        return new Response("驗證成功", { status: 200 });
      },
    };

    await t.test("successful with correct credentials", async () => {
      const repo = new RestHeroRepo({
        host: "https://hahow-recruit.herokuapp.com",
        port: "443",
        fetcher,
      });

      const r = await repo.authenticate({
        name: "hahow",
        password: "rocks",
      });

      assert.ok(r.ok);
    });

    await t.test("unsuccessful with invalid credentials", async () => {
      const repo = new RestHeroRepo({
        host: "https://hahow-recruit.herokuapp.com",
        port: "443",
        fetcher,
      });

      const r = await repo.authenticate({
        name: "zazow",
        password: "zockz",
      });

      assert.ok(!r.ok);
    });

    await t.test("correct error code for invalid credentials", async () => {
      const repo = new RestHeroRepo({
        host: "https://hahow-recruit.herokuapp.com",
        port: "443",
        fetcher,
      });

      const r = await repo.authenticate({
        name: "zazo",
        password: "zockz",
      });

      assert.ok(!r.ok);
      assert.equal(r.code, "err.repo.hero.auth");
    });

    await t.test("unsuccessful with invalid request format", async () => {
      const repo = new RestHeroRepo({
        host: "https://hahow-recruit.herokuapp.com",
        port: "443",
        fetcher,
      });

      const a: any = repo.authenticate.bind(repo);
      const r: Awaited<ReturnType<typeof repo.authenticate>> = await a({
        show: "me the secret",
      });

      assert.ok(!r.ok);
    });

    await t.test("correct error code for invalid request format", async () => {
      const repo = new RestHeroRepo({
        host: "https://hahow-recruit.herokuapp.com",
        port: "443",
        fetcher,
      });

      const a: any = repo.authenticate.bind(repo);
      const r: Awaited<ReturnType<typeof repo.authenticate>> = await a({
        show: "me the secret",
      });

      assert.ok(!r.ok);
      assert.equal(r.code, "err.repo.hero.client");
    });

    await t.test("unsuccessful with unknown response", async () => {
      const repo = new RestHeroRepo({
        host: "https://hahow-recruit.herokuapp.com",
        port: "443",
        fetcher: { fetch: async () => new Response("", { status: 500 }) },
      });

      const r = await repo.authenticate({
        name: "hahow",
        password: "rocks",
      });

      assert.ok(!r.ok);
    });

    await t.test("correct error code for unknown response", async () => {
      const repo = new RestHeroRepo({
        host: "https://hahow-recruit.herokuapp.com",
        port: "443",
        fetcher: { fetch: async () => new Response("", { status: 500 }) },
      });

      const r = await repo.authenticate({
        name: "hahow",
        password: "rocks",
      });

      assert.ok(!r.ok);
      assert.equal(r.code, "err.repo.hero.unknown");
    });
  });
});
