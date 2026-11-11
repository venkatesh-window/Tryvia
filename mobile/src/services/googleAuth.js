import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import { authService } from "../api/services/authService";
import { getBaseUrl } from "../api/client";

WebBrowser.maybeCompleteAuthSession();

/**
 * Initiates direct Google OAuth 2.0 flow without any third-party middleman (e.g. Clerk).
 * 1. Opens Google's authorization endpoint using our HTTPS backend callback bridge
 *    so a single Google Web OAuth Client ID works across APK, Play Store AAB, Expo Go, iOS, and Web.
 * 2. Fetches verified user identity from Google UserInfo API (https://www.googleapis.com/oauth2/v3/userinfo).
 * 3. Syncs with TryVia backend /api/v1/auth/sync with google_access_token verification.
 */
export async function signInWithGoogleDirect() {
  const clientId =
    process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ||
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;

  const appRedirectUri = AuthSession.makeRedirectUri({
    path: "oauth-native-callback",
  });
  const httpsBridgeUri = `${getBaseUrl()}/auth/google/callback`;

  if (!clientId) {
    return {
      status: "missing_client_id",
      redirectUri: httpsBridgeUri,
    };
  }

  try {
    const authUrl =
      `https://accounts.google.com/o/oauth2/v2/auth` +
      `?client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(httpsBridgeUri)}` +
      `&response_type=token` +
      `&scope=${encodeURIComponent("openid email profile")}` +
      `&prompt=select_account` +
      `&state=${encodeURIComponent(appRedirectUri)}`;

    const result = await WebBrowser.openAuthSessionAsync(authUrl, appRedirectUri);

    if (result.type !== "success" || !result.url) {
      return {
        status: "cancelled",
      };
    }

    // Extract access_token or error from redirect URL fragment or query params
    const rawFragment = result.url.split("#")[1] || result.url.split("?")[1] || "";
    const params = new URLSearchParams(rawFragment);
    const oauthError = params.get("error");
    if (oauthError) {
      if (oauthError === "access_denied") {
        return { status: "cancelled" };
      }
      return {
        status: "failed",
        error: `Google authentication returned: ${oauthError}`,
      };
    }

    const accessToken = params.get("access_token");

    if (!accessToken) {
      return {
        status: "failed",
        error: "Google authentication was completed, but no access token was returned.",
      };
    }

    // Fetch user profile directly from Google
    const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!profileRes.ok) {
      return {
        status: "failed",
        error: "Failed to fetch user profile from Google.",
      };
    }

    const googleUser = await profileRes.json();
    const email = googleUser.email;
    const fullName =
      googleUser.name ||
      `${googleUser.given_name || ""} ${googleUser.family_name || ""}`.trim() ||
      email.split("@")[0];

    if (!email) {
      return {
        status: "failed",
        error: "No verified email associated with this Google account.",
      };
    }

    // Synchronize with Tryvia backend (passing google_access_token for server verification)
    const syncRes = await authService.sync({
      email,
      fullName,
      google_access_token: accessToken,
    });

    if (!syncRes?.access_token) {
      return {
        status: "failed",
        error: "Server sync failed. Please try again.",
      };
    }

    return {
      status: "complete",
      token: syncRes.access_token,
      user: {
        id: String(syncRes.user.id),
        email: syncRes.user.email,
        fullName: syncRes.user.full_name || fullName,
        role: syncRes.user.role || "CUSTOMER",
        walletBalance: syncRes.user.wallet_balance ?? 0,
        points: syncRes.user.points ?? 0,
        loyaltyTier: syncRes.user.loyalty_tier || "TRYVIA MEMBER",
        tryviaStars: syncRes.user.stars ?? 0,
      },
    };
  } catch (err) {
    console.error("Direct Google Sign-In error:", err);
    return {
      status: "failed",
      error: err?.message || "Google Sign-In encountered an error.",
    };
  }
}

/**
 * Fast test sync for development when Google Client ID has not yet been configured in .env
 */
export async function fastTestSync(email, fullName) {
  const cleanEmail = String(email || "").trim().toLowerCase();
  const cleanName = String(fullName || "").trim();

  if (!cleanEmail || !cleanEmail.includes("@")) {
    return {
      status: "failed",
      error: "Please enter a valid Google email address.",
    };
  }

  const syncRes = await authService.sync({
    email: cleanEmail,
    fullName: cleanName || cleanEmail.split("@")[0],
  });

  if (!syncRes?.access_token) {
    return {
      status: "failed",
      error: "Sync failed. Could not obtain session token.",
    };
  }

  return {
    status: "complete",
    token: syncRes.access_token,
    user: {
      id: String(syncRes.user.id),
      email: syncRes.user.email,
      fullName: syncRes.user.full_name || cleanName || cleanEmail.split("@")[0],
      role: syncRes.user.role || "CUSTOMER",
      walletBalance: syncRes.user.wallet_balance ?? 0,
      points: syncRes.user.points ?? 0,
      loyaltyTier: syncRes.user.loyalty_tier || "TRYVIA MEMBER",
      tryviaStars: syncRes.user.stars ?? 0,
    },
  };
}

