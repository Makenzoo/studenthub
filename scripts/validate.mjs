import assert from "node:assert/strict";
import worker from "../worker/index.js";

assert.equal(typeof worker.fetch, "function");
const response = await worker.fetch(new Request("https://studenthub.test/"), {});
assert.equal(response.status, 200);
assert.match(await response.text(), /StudentHub KZ/);
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
