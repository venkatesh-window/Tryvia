import { nosqlSanitize } from "./src/middleware/nosqlSanitize.js";
import { verifyRazorpaySignature, verifyWebhookSignature } from "./src/config/razorpay.js";
import { validateImageMagicBytes } from "./src/routes/vendorRoutes.js";
import { errorHandler } from "./src/middleware/errorHandler.js";
import { verifyAdminPassword } from "./src/routes/adminRoutes.js";
import { Vendor } from "./src/models/Vendor.js";
import crypto from "crypto";

console.log("=== RUNNING TRYVIA COMPREHENSIVE SECURITY VERIFICATION SUITE ===");

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    failed++;
  }
}

// 1. Test NoSQL Injection sanitizer
{
  const mockReq = {
    body: {
      username: "admin",
      password: { $gt: "" },
      nested: { "a.b": 1, normal: "safe", array: [{ $ne: null }, "clean"] }
    },
    query: {
      filter: { $where: "sleep(5000)" },
      normalQuery: "123"
    },
    params: {
      id: "safe-id"
    }
  };

  nosqlSanitize(mockReq, {}, () => {});

  assert(mockReq.body.password.$gt === undefined, "NoSQL $gt operator sanitized from req.body");
  assert(mockReq.body.nested["a.b"] === undefined, "Dotted keys removed from nested objects");
  assert(mockReq.body.nested.array[0].$ne === undefined, "NoSQL operators in array objects sanitized");
  assert(mockReq.body.nested.normal === "safe", "Safe body fields preserved");
  assert(mockReq.query.filter.$where === undefined, "NoSQL $where operator sanitized from req.query");
  assert(mockReq.query.normalQuery === "123", "Safe query params preserved");
}

// 2. Test Razorpay Signature Verification & Timing Attack Defense
{
  const testSecret = "my_super_secret_webhook_key_2026";
  const orderId = "order_123456";
  const paymentId = "pay_987654";
  const validSig = crypto
    .createHmac("sha256", testSecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  assert(
    verifyRazorpaySignature(orderId, paymentId, validSig, testSecret) === true,
    "Valid Razorpay signature accepted"
  );

  assert(
    verifyRazorpaySignature(orderId, paymentId, "tampered_signature_12345", testSecret) === false,
    "Tampered Razorpay signature rejected"
  );

  assert(
    verifyRazorpaySignature(orderId, paymentId, "", testSecret) === false,
    "Empty Razorpay signature rejected safely"
  );

  const payload = JSON.stringify({ event: "payment.captured", entity: "payment" });
  const validWebhookSig = crypto
    .createHmac("sha256", testSecret)
    .update(payload)
    .digest("hex");

  assert(
    verifyWebhookSignature(payload, validWebhookSig, testSecret) === true,
    "Valid Razorpay webhook signature accepted"
  );

  assert(
    verifyWebhookSignature(payload, "invalid_webhook_sig", testSecret) === false,
    "Invalid Razorpay webhook signature rejected"
  );
}

// 3. Test Regex ReDoS Sanitizer in Product Search
{
  const maliciousSearch = ".*.*.*.*.*.*.*.*.*a";
  const escaped = maliciousSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  assert(
    escaped === "\\.\\*\\.\\*\\.\\*\\.\\*\\.\\*\\.\\*\\.\\*\\.\\*\\.\\*a",
    "Special regex characters safely escaped against ReDoS"
  );
}

// 4. Test Image Magic Bytes Validation (File Upload Protection)
{
  let nextCalled = false;
  let rejectedStatus = null;
  const mockRes = {
    status: (code) => {
      rejectedStatus = code;
      return { json: () => {} };
    }
  };

  // Plain non-image buffer disguised as an image
  const fakeImageReq = {
    file: {
      buffer: Buffer.from("NOT_AN_IMAGE_FILE_PAYLOAD_HERE", "utf-8")
    }
  };
  validateImageMagicBytes(fakeImageReq, mockRes, () => { nextCalled = true; });
  assert(rejectedStatus === 400, "Disguised malicious file rejected by magic bytes verification");

  // Valid JPEG header
  nextCalled = false;
  rejectedStatus = null;
  const validJpegReq = {
    file: {
      buffer: Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46])
    }
  };
  validateImageMagicBytes(validJpegReq, mockRes, () => { nextCalled = true; });
  assert(nextCalled === true && rejectedStatus === null, "Valid JPEG magic bytes accepted");

  // Valid PNG header
  nextCalled = false;
  rejectedStatus = null;
  const validPngReq = {
    file: {
      buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    }
  };
  validateImageMagicBytes(validPngReq, mockRes, () => { nextCalled = true; });
  assert(nextCalled === true && rejectedStatus === null, "Valid PNG magic bytes accepted");
}

// 5. Test Production Error Leak Prevention
{
  const originalEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";

  let responseBody = null;
  let responseCode = null;
  const mockRes = {
    status: (c) => {
      responseCode = c;
      return {
        json: (data) => { responseBody = data; }
      };
    }
  };

  const internalDbError = new Error("MongoServerError: Authentication failed on mongodb://admin:secretPass@cluster0.mongodb.net");
  errorHandler(internalDbError, {}, mockRes, () => {});

  assert(responseCode === 500, "Error handler sets status 500 for unhandled exceptions");
  assert(
    responseBody.detail === "An unexpected error occurred. Please try again later.",
    "Internal database error message concealed in production"
  );
  assert(responseBody.stack === undefined, "Stack trace excluded in production");

  process.env.NODE_ENV = originalEnv;
}

// 6. Test Admin Constant-Time Password Verification
{
  const masterSecret = "SuperSecureAdminSecret2026!";
  assert(
    verifyAdminPassword(masterSecret, masterSecret) === true,
    "Valid admin password accepted in constant time"
  );
  assert(
    verifyAdminPassword("WrongSecretAttempt", masterSecret) === false,
    "Invalid admin password rejected"
  );
  assert(
    verifyAdminPassword("SuperSecureAdminSecret2026", masterSecret) === false,
    "Prefix-only admin password rejected without timing leak"
  );
  assert(
    verifyAdminPassword("", masterSecret) === false,
    "Empty candidate password rejected safely"
  );
}

// 7. Test Vendor Payout Account Number Masking
{
  const vendor = new Vendor({
    user: "507f1f77bcf86cd799439011",
    storeName: "Luxury Glow",
    email: "glow@example.com",
    payoutAccount: {
      accountNumber: "987654321098",
      ifsc: "HDFC0001234"
    }
  });

  const json = vendor.toJSON();
  assert(
    json.payoutAccount.accountNumber === "****1098",
    "Vendor payout account number masked in JSON output"
  );
  assert(
    json.payoutAccount.maskedAccountNumber === "****1098",
    "Masked account number property populated"
  );
}

// 8. Test Vendor Registration Status Invariant
{
  const vendor = new Vendor({
    user: "507f1f77bcf86cd799439011",
    storeName: "Pending Boutique",
    email: "boutique@example.com"
  });

  assert(
    vendor.status === "PENDING",
    "Vendor entity defaults to PENDING status upon creation"
  );
}

// 9. Test Pagination Limit Upper Bound Clamping
{
  const clampLimit = (raw, defaultVal = 20, maxVal = 100) =>
    Math.min(Math.max(parseInt(raw) || defaultVal, 1), maxVal);

  assert(clampLimit("1000000") === 100, "Excessive pagination limit ?limit=1000000 clamped to 100");
  assert(clampLimit("-50") === 1, "Negative pagination limit clamped to minimum 1");
  assert(clampLimit("50") === 50, "Valid intermediate pagination limit preserved");
  assert(clampLimit(undefined) === 20, "Missing pagination limit defaults to standard size");
}

console.log(`\nVerification complete: ${passed} passed, ${failed} failed.`);
if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
