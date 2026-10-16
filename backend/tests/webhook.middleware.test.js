import assert from "node:assert/strict";
import test, { afterEach, beforeEach } from "node:test";
import express from "express";

import { validateMpesaWebhook } from "../middleware/webhook.middleware.js";
import mpesaRoutes from "../routes/mpesa.routes.js";
import withdrawalRoutes from "../routes/withdrawal.routes.js";

const SECRET = "a".repeat(32);
const ENV_KEYS = ["MPESA_WEBHOOK_SECRET", "MPESA_ALLOWED_IPS", "NODE_ENV"];

let saved;
let originalWarn;
let originalError;

beforeEach(() => {
  saved = Object.fromEntries(ENV_KEYS.map((k) => [k, process.env[k]]));
  for (const k of ENV_KEYS) delete process.env[k];
  originalWarn = console.warn;
  originalError = console.error;
  console.warn = () => {};
  console.error = () => {};
});

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
  console.warn = originalWarn;
  console.error = originalError;
});

// Runs `fn(baseUrl)` against a throwaway server, then shuts it down.
const withServer = async (app, fn) => {
  const server = await new Promise((resolve) => {
    const s = app.listen(0, "127.0.0.1", () => resolve(s));
  });

  try {
    return await fn(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
};

const post = (url, body = { ping: true }) =>
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

// Minimal app: only the middleware plus a stub handler that records hits.
const buildStubApp = () => {
  const hits = { count: 0 };
  const app = express();
  app.use(express.json());
  app.post("/callback/:secret", validateMpesaWebhook, (req, res) => {
    hits.count += 1;
    res.json({ ok: true });
  });
  return { app, hits };
};

test("rejects a callback with the wrong secret and never reaches the handler", async () => {
  process.env.MPESA_WEBHOOK_SECRET = SECRET;
  const { app, hits } = buildStubApp();

  await withServer(app, async (base) => {
    const res = await post(`${base}/callback/${"b".repeat(32)}`);

    assert.equal(res.status, 403);
    assert.equal(hits.count, 0);
  });
});

test("accepts a callback with the correct secret", async () => {
  process.env.MPESA_WEBHOOK_SECRET = SECRET;
  const { app, hits } = buildStubApp();

  await withServer(app, async (base) => {
    const res = await post(`${base}/callback/${SECRET}`);

    assert.equal(res.status, 200);
    assert.equal(hits.count, 1);
  });
});

test("secrets that differ in length or by one character are rejected", async () => {
  process.env.MPESA_WEBHOOK_SECRET = SECRET;
  const { app, hits } = buildStubApp();

  await withServer(app, async (base) => {
    for (const attempt of [SECRET.slice(0, -1), `${SECRET}x`, `${SECRET.slice(0, -1)}b`, "x"]) {
      const res = await post(`${base}/callback/${attempt}`);
      assert.equal(res.status, 403, `"${attempt}" should be rejected`);
    }
    assert.equal(hits.count, 0);
  });
});

test("FAILS CLOSED when no secret is configured outside development", async () => {
  // Covers NODE_ENV unset, "production" and "test".
  for (const env of [undefined, "production", "test"]) {
    delete process.env.MPESA_WEBHOOK_SECRET;
    if (env === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = env;

    const { app, hits } = buildStubApp();

    await withServer(app, async (base) => {
      const res = await post(`${base}/callback/anything`);

      assert.equal(res.status, 503, `NODE_ENV=${env} must fail closed`);
      assert.equal(hits.count, 0);
    });
  }
});

test("allows unauthenticated callbacks only when NODE_ENV=development and no secret is set", async () => {
  process.env.NODE_ENV = "development";
  const { app, hits } = buildStubApp();

  await withServer(app, async (base) => {
    const res = await post(`${base}/callback/dev`);

    assert.equal(res.status, 200);
    assert.equal(hits.count, 1);
  });
});

test("a configured secret is still enforced in development", async () => {
  process.env.NODE_ENV = "development";
  process.env.MPESA_WEBHOOK_SECRET = SECRET;
  const { app, hits } = buildStubApp();

  await withServer(app, async (base) => {
    const res = await post(`${base}/callback/wrong`);

    assert.equal(res.status, 403);
    assert.equal(hits.count, 0);
  });
});

test("rejects a too-short secret outside development", async () => {
  process.env.MPESA_WEBHOOK_SECRET = "short";
  const { app, hits } = buildStubApp();

  await withServer(app, async (base) => {
    const res = await post(`${base}/callback/short`);

    assert.equal(res.status, 503);
    assert.equal(hits.count, 0);
  });
});

test("optional IP allowlist: blocks other IPs, allows listed ones (incl. IPv4-mapped IPv6)", async () => {
  process.env.MPESA_WEBHOOK_SECRET = SECRET;

  process.env.MPESA_ALLOWED_IPS = "196.201.214.200, 196.201.214.201";
  let stub = buildStubApp();
  await withServer(stub.app, async (base) => {
    const res = await post(`${base}/callback/${SECRET}`);
    assert.equal(res.status, 403);
    assert.equal(stub.hits.count, 0);
  });

  process.env.MPESA_ALLOWED_IPS = "10.9.9.9,127.0.0.1";
  stub = buildStubApp();
  await withServer(stub.app, async (base) => {
    const res = await post(`${base}/callback/${SECRET}`);
    assert.equal(res.status, 200);
    assert.equal(stub.hits.count, 1);
  });
});

// ------------------------------------------------------------
// Real routers: proves the wiring, not just the middleware.
// All requests below are rejected before any controller or DB
// code runs, so no database is needed.
// ------------------------------------------------------------

const buildRealApp = () => {
  const app = express();
  app.use(express.json());
  app.use("/api/mpesa", mpesaRoutes);
  app.use("/api/withdrawals", withdrawalRoutes);
  return app;
};

const forgedStkSuccess = {
  Body: {
    stkCallback: {
      CheckoutRequestID: "ws_CO_forged",
      ResultCode: 0,
      ResultDesc: "The service request is processed successfully.",
      CallbackMetadata: {
        Item: [
          { Name: "Amount", Value: 1 },
          { Name: "MpesaReceiptNumber", Value: "FAKE123456" },
        ],
      },
    },
  },
};

test("REGRESSION: the old unauthenticated callback URLs no longer exist", async () => {
  process.env.MPESA_WEBHOOK_SECRET = SECRET;

  await withServer(buildRealApp(), async (base) => {
    for (const path of [
      "/api/mpesa/callback",
      "/api/mpesa/b2c-callback",
      "/api/mpesa/b2c-timeout",
      "/api/withdrawals/b2c/result",
      "/api/withdrawals/b2c/timeout",
    ]) {
      const res = await post(`${base}${path}`, forgedStkSuccess);
      assert.equal(res.status, 404, `${path} must not be routable without a secret`);
    }
  });
});

test("REGRESSION: a forged STK success callback with a wrong secret is rejected (403)", async () => {
  process.env.MPESA_WEBHOOK_SECRET = SECRET;

  await withServer(buildRealApp(), async (base) => {
    for (const path of [
      "/api/mpesa/callback",
      "/api/mpesa/b2c-callback",
      "/api/mpesa/b2c-timeout",
      "/api/withdrawals/b2c/result",
      "/api/withdrawals/b2c/timeout",
    ]) {
      const res = await post(`${base}${path}/not-the-secret`, forgedStkSuccess);
      assert.equal(res.status, 403, `${path} must reject a wrong secret`);
    }
  });
});

test("real routes fail closed (503) when the secret is not configured in production", async () => {
  process.env.NODE_ENV = "production";

  await withServer(buildRealApp(), async (base) => {
    const res = await post(`${base}/api/mpesa/callback/${SECRET}`, forgedStkSuccess);
    assert.equal(res.status, 503);
  });
});
