# SkillSync App Testing Report

**Prepared:** 16 October 2026
**Repository:** `Maxbravins/Skillsync_App`
**Branch/revision inspected:** `main`, based on `73e0d87` (`Fix transaction validation for Mongoose 9`), with the payment receipt fix prepared in this update.

## Summary

The frontend production build succeeds. The focused M-Pesa callback tests pass (13/13). The full backend test run produced 16 passing tests and 11 webhook tests blocked because the restricted local environment would not allow those tests to open a loopback HTTP connection (`EACCES 127.0.0.1`). The test output does not establish that those 11 cases fail in the application; they could not reach their test server.

The reported authentication, upload, and payment issues were investigated and several fixes were committed. The latest live M-Pesa attempt remains unverified: the user canceled the prompt, the app still showed a pending transaction, and no Render callback logs or M-Pesa account confirmation were available in this session. Do not charge again until that transaction is reconciled.

## Verification performed for this report

| Check | Result | Details |
|---|---|---|
| Frontend production build | Pass | `npm run build` completed. Vite emitted a non-blocking warning that the minified JavaScript chunk is over 500 kB. |
| Backend test suite | Partial | 16 passed; 11 webhook HTTP tests could not connect to local loopback because the environment returned `EACCES`. |
| Focused M-Pesa callback tests after receipt fix | Pass | 13 tests passed. Backend syntax checks and `git diff --check` also passed. |
| Git status | Clean tracked files | Branch is `main` at `73e0d87`, matching `origin/main`. Two untracked patch artifacts are present and were not included in this report's changes. |
| Live M-Pesa transaction | Not verified | User canceled the prompt. The browser showed pending status and repeated HTTP 409 responses; Render callback logs and provider-side transaction status were not available. |

## Issues encountered and resolutions

### 1. User was logged out after refreshing

**Observed:** Refreshing the app could lose the authenticated session, including when multiple requests attempted to refresh the same single-use refresh cookie.

**Resolution recorded in Git:** Session restoration now refreshes the access token and loads the canonical user record. Concurrent refreshes are coordinated with the browser Web Locks API, with a retry for a refresh-token rotation conflict.

**Commit:** `b396cfb` — `Prevent logout during concurrent session refresh`.

### 2. Profile image appeared to upload but did not display

**Observed:** The profile API returned success while the user record retained the old image path. The browser then received a 404 for the stored `/uploads/profiles/...jpg` URL on Vercel.

**Resolutions recorded in Git:** Profile images were routed to local disk storage for the demo, and the shared Axios request handler was corrected to let the browser set the multipart `Content-Type` boundary for `FormData` uploads.

**Commits:** `032f9fb` — `Store profile photos locally for demo`; `64d8fce` — `Send profile uploads as multipart form data`.

**Remaining deployment limitation:** Local disk on a serverless or ephemeral host may not persist across instances/redeploys. The observed Vercel 404 means the old image URL was not available there. A durable hosted storage provider or persistent volume is needed for reliable production image delivery. A fresh upload and live display were not confirmed after the multipart fix.

### 3. M-Pesa initiation showed “next is not a function”

**Observed:** The transaction validation middleware used the callback-style `next` argument, while the project uses Mongoose 9, which no longer supplies `next` to pre middleware.

**Resolution recorded in Git:** The validation hook now throws validation errors directly and does not call `next`.

**Commit:** `73e0d87` — `Fix transaction validation for Mongoose 9`.

### 4. Repeated HTTP 409 while reconciling a platform-fee payment

**Observed:** `POST /api/platform-payment/:jobId/reconcile` returned 409 and the UI said payment confirmation was pending.

**Meaning:** In the current controller, 409 is intentionally returned when there is no completed transaction with a successful M-Pesa result code. It is not proof that payment succeeded or failed. The job stays unpublished until a successful callback is recorded.

**Current status:** The user canceled the M-Pesa prompt. The transaction was still shown as pending, so its final status was not confirmed in the available evidence. Check the Render service logs for the platform callback and confirm the provider-side result before trying another charge.

### 5. HTTP 401 from the M-Pesa transaction-status endpoint

**Observed:** `GET /api/mpesa/status/:transactionId` returned 401 during polling.

**Meaning:** The status route requires an access token. The frontend attempts to refresh the token after a 401, but the browser log alone does not show whether that refresh succeeded. This response is an authentication failure; it does not establish the payment result.

**Action needed:** If it recurs, inspect the response to `/api/auth/refresh-token` and the browser's authenticated session, then retry status lookup after signing in. Do not treat the 401 as authorization to make another payment.

### 6. Browser “listener indicated an asynchronous response” warning

**Observed:** Chrome reported an asynchronous message-channel warning in the console.

**Assessment:** This message commonly comes from a browser extension and is separate from the app's HTTP 409/401 responses. It does not explain the pending M-Pesa callback.

### 7. Duplicate empty M-Pesa receipt (`E11000`)

**Observed:** MongoDB rejected a transaction write with `unique_mpesa_receipt` and duplicate key `{ "mpesa.mpesaReceiptNumber": "" }` after the user completed the payment prompt.

**Cause:** The schema defaulted the receipt number to an empty string. A sparse unique index still indexes an empty string, so the placeholder collided with another transaction. The platform-fee controller also sent the STK prompt before it inserted the transaction record, allowing a database failure after M-Pesa had already accepted the request.

**Resolution prepared in this update:** Receipt and checkout request IDs are omitted until provided, and the pending platform-fee transaction is saved before the STK prompt. If M-Pesa initiation fails, that pending record is marked failed. Focused M-Pesa callback tests pass after the change.

**Recovery limitation:** The already-reported payment may have no corresponding transaction record if its insert failed after the prompt. The new code cannot reconstruct that past record by itself. Reconcile it against the M-Pesa receipt and Render callback logs before any further payment attempt.

## Payment configuration note

The checked-in M-Pesa service constructs requests against `https://sandbox.safaricom.co.ke`. Therefore the current code is configured for the Daraja sandbox, not live production charges. Before accepting real customer payments, configure the official production endpoint and credentials, confirm the registered callback URL, and verify callback delivery end to end. The platform callback URL is assembled from `BACKEND_URL`; confirm that it points to the deployed Render API and that Render logs show incoming callbacks.

## Recommended next steps

1. Check Render logs for the callback corresponding to the canceled transaction and reconcile its final status.
2. Confirm whether the transaction was canceled or charged in the M-Pesa account/provider records. Avoid submitting another payment until confirmed.
3. Verify the deployed payment environment is intentionally sandbox or production; the current source points to sandbox.
4. Re-test a profile photo after deploying the multipart fix, and move profile images to durable storage before relying on them in a deployed presentation.
5. Re-run the backend webhook tests in an environment that permits local loopback connections; address the Vite chunk-size warning separately if desired.
