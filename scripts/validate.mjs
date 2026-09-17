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
const writes = [];
const adminDb = {
  prepare(sql) {
    return {
      bind(...params) { this.params = params; return this; },
      async all() { return { results: [] }; },
      async run() { writes.push(sql); return { meta: {} }; },
    };
  },
};
const admin = await worker.fetch(
  new Request("https://studenthub.test/api/admin/catalog", { headers: { "oai-authenticated-user-id": "owner", "oai-authenticated-user-email": "owner@example.com" } }),
  { DB: adminDb, ADMIN_EMAILS: "owner@example.com" },
);
assert.equal(admin.status, 200);
assert.equal(writes.length, 1);
console.log("Worker entrypoint is valid.");
