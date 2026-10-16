import assert from "node:assert/strict";
import test, { afterEach, beforeEach, mock } from "node:test";
import mongoose from "mongoose";

import Transaction from "../models/transaction.model.js";
import { mpesaCallback } from "../controllers/mpesa.controller.js";

let originalError;
let originalLog;

beforeEach(() => {
  originalError = console.error;
  originalLog = console.log;
  console.error = () => {};
  console.log = () => {};
});

afterEach(() => {
  mock.restoreAll();
  console.error = originalError;
  console.log = originalLog;
});

const makeTransaction = (overrides = {}) => ({
  transactionId: "TX-TEST-1",
  status: "pending",
  totalAmount: 1050,
  application: "application-id",
  mpesa: {},
  save: mock.fn(async () => {}),
  markCompleted: mock.fn(async () => {}),
  markFailed: mock.fn(async () => {}),
  markForReview: mock.fn(async () => {}),
  ...overrides,
});

const makeRes = () => ({
  statusCode: null,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});

const successCallback = (items) => ({
  body: {
    Body: {
      stkCallback: {
        CheckoutRequestID: "ws_CO_123",
        ResultCode: 0,
        ResultDesc: "The service request is processed successfully.",
        CallbackMetadata: { Item: items },
      },
    },
  },
});

const run = async (tx, req) => {
  mock.method(Transaction, "findOne", async () => tx);
  // If a payment IS accepted, processSuccessfulPayment opens a DB
  // session. Stub it so the test never needs a database.
  mock.method(mongoose, "startSession", async () => {
    throw new Error("startSession stubbed: payment was accepted");
  });

  const res = makeRes();
  await mpesaCallback(req, res);
  return res;
};

test("REGRESSION: success callback with NO Amount is not credited", async () => {
  const tx = makeTransaction();
  const res = await run(
    tx,
    successCallback([{ Name: "MpesaReceiptNumber", Value: "NLJ7RT61SV" }])
  );

  assert.equal(res.statusCode, 200); // Safaricom is still acknowledged
  assert.equal(tx.markCompleted.mock.callCount(), 0);
  assert.equal(tx.markForReview.mock.callCount(), 1);
  assert.match(tx.markForReview.mock.calls[0].arguments[0], /missing the paid amount/i);
});

test("success callback with the wrong amount is not credited", async () => {
  const tx = makeTransaction();
  const res = await run(
    tx,
    successCallback([
      { Name: "Amount", Value: 1 },
      { Name: "MpesaReceiptNumber", Value: "NLJ7RT61SV" },
    ])
  );

  assert.equal(res.statusCode, 200);
  assert.equal(tx.markCompleted.mock.callCount(), 0);
  assert.equal(tx.markForReview.mock.callCount(), 1);
  assert.match(tx.markForReview.mock.calls[0].arguments[0], /mismatch/i);
});

test("success callback with no receipt number is not credited", async () => {
  const tx = makeTransaction();
  await run(tx, successCallback([{ Name: "Amount", Value: 1050 }]));

  assert.equal(tx.markCompleted.mock.callCount(), 0);
  assert.equal(tx.markForReview.mock.callCount(), 1);
  assert.match(tx.markForReview.mock.calls[0].arguments[0], /receipt/i);
});

test("a correct success callback proceeds to completion with the receipt", async () => {
  const tx = makeTransaction();
  await run(
    tx,
    successCallback([
      { Name: "Amount", Value: 1050 },
      { Name: "MpesaReceiptNumber", Value: "NLJ7RT61SV" },
    ])
  );

  assert.equal(tx.markForReview.mock.callCount(), 0);
  assert.equal(tx.markCompleted.mock.callCount(), 1);
  assert.equal(tx.markCompleted.mock.calls[0].arguments[0], "NLJ7RT61SV");
});

test("an already-completed transaction is ignored (idempotency preserved)", async () => {
  const tx = makeTransaction({ status: "completed" });
  await run(
    tx,
    successCallback([
      { Name: "Amount", Value: 1050 },
      { Name: "MpesaReceiptNumber", Value: "NLJ7RT61SV" },
    ])
  );

  assert.equal(tx.markCompleted.mock.callCount(), 0);
  assert.equal(tx.markForReview.mock.callCount(), 0);
});
