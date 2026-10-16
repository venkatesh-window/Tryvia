import Razorpay from "razorpay";
import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config();

export const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "";
export const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "";
export const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || "";

export const razorpayClient = new Razorpay({
  key_id: RAZORPAY_KEY_ID || "unconfigured_key",
  key_secret: RAZORPAY_KEY_SECRET || "unconfigured_secret",
});

/**
 * Verify Razorpay HMAC SHA256 payment signature with timing-safe comparison
 */
export function verifyRazorpaySignature(orderId, paymentId, signature, secret = RAZORPAY_KEY_SECRET) {
  if (!secret || !signature || !orderId || !paymentId) {
    return false;
  }
  try {
    const body = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body.toString())
      .digest("hex");

    const expectedBuf = Buffer.from(expectedSignature, "utf-8");
    const sigBuf = Buffer.from(signature, "utf-8");
    if (expectedBuf.length !== sigBuf.length) {
      return false;
    }
    return crypto.timingSafeEqual(expectedBuf, sigBuf);
  } catch (err) {
    return false;
  }
}

/**
 * Verify Razorpay Webhook signature with timing-safe comparison
 */
export function verifyWebhookSignature(rawBody, signature, secret = RAZORPAY_WEBHOOK_SECRET) {
  if (!secret || !signature || !rawBody) {
    return false;
  }
  try {
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    const expectedBuf = Buffer.from(expectedSignature, "utf-8");
    const sigBuf = Buffer.from(signature, "utf-8");
    if (expectedBuf.length !== sigBuf.length) {
      return false;
    }
    return crypto.timingSafeEqual(expectedBuf, sigBuf);
  } catch (err) {
    return false;
  }
}
