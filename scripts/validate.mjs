import assert from "node:assert/strict";
import worker from "../worker/index.js";

assert.equal(typeof worker.fetch, "function");
const response = await worker.fetch(new Request("https://studenthub.test/"), {});
assert.equal(response.status, 200);
const home = await response.text();
assert.match(home, /StudentHub KZ/);
assert.match(home, /Всё для студенческой жизни/);
const db = {
  prepare() {
    return {
      bind() { return this; },
      async all() { return { results: [] }; },
    };
  },
};
const catalog = await worker.fetch(
  new Request("https://studenthub.test/api/catalog/university"),
  { DB: db },
);
assert.deepEqual(await catalog.json(), { items: [] });
console.log("Worker entrypoint is valid.");
