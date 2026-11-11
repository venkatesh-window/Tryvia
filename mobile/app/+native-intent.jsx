/**
 * Intercepts payment-callback deep links returned from Razorpay's WebBrowser session.
 * When the app is already open (checkout modal active), returning null keeps the current
 * screen mounted so WebBrowser.openAuthSessionAsync completes verification without 404ing.
 */
export function redirectSystemPath({ path, initial }) {
  try {
    if (typeof path === "string" && path.includes("payment-callback")) {
      if (!initial) {
        return null;
      }
      const isCancelledOrFailed =
        path.includes("status=cancelled") || path.includes("status=failed");
      return isCancelledOrFailed ? "/(tabs)" : "/(tabs)/orders";
    }
    if (typeof path === "string" && path.includes("oauth-native-callback") && !initial) {
      return null;
    }
  } catch {
    return path;
  }
  return path;
}

