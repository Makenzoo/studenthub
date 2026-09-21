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
const summaryDb = {
  prepare(sql) {
    return {
      async first() {
        if (sql.includes("jobs")) return { count: 3, checked_at: "2026-09-20" };
        if (sql.includes("grants")) return { count: 2, checked_at: "2026-09-19" };
        return { count: 1, checked_at: "2026-09-18" };
      },
    };
  },
};
const summary = await worker.fetch(new Request("https://studenthub.test/api/home-summary"), { DB: summaryDb });
assert.deepEqual(await summary.json(), { items: { jobs: { count: 3, checkedAt: "2026-09-20" }, grants: { count: 2, checkedAt: "2026-09-19" }, housing: { count: 1, checkedAt: "2026-09-18" } } });
const assistant = await worker.fetch(
  new Request("https://studenthub.test/api/assistant", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ messages: [{ role: "user", content: "Помоги найти стажировку" }] }) }),
  {},
);
const assistantBody = await assistant.json();
assert.equal(assistantBody.mode, "guide");
assert.match(assistantBody.reply, /стажировок/);
const notifications = await worker.fetch(new Request("https://studenthub.test/api/notifications"), {});
assert.deepEqual(await notifications.json(), { items: [], profileReady: false, loginRequired: true });
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
