import { authService } from "../api/services/authService";
import { tokenCache } from "../utils/tokenCache";

export class ClerkService {
  /**
   * Authoritative Sign In with Email & Password
   */
  static async signIn(email, password) {
    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanPassword = String(password || "");

    if (!cleanEmail || !cleanPassword) {
      return {
        status: "failed",
        error: "Please enter both email and password.",
      };
    }

    try {
      const loginRes = await authService.login({
        email: cleanEmail,
        password: cleanPassword,
      });

      if (loginRes?.access_token) {
        return {
          status: "complete",
          token: loginRes.access_token,
          user: {
            id: String(loginRes.user.id),
            email: loginRes.user.email,
            fullName: loginRes.user.full_name || cleanEmail.split("@")[0],
            role: loginRes.user.role || "CUSTOMER",
          },
        };
      }

      return {
        status: "failed",
        error: "Authentication failed. No access token received.",
      };
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        "Invalid email or password.";
      return {
        status: "failed",
        error: detail,
      };
    }
  }

  /**
   * Authoritative Sign Up with Email & Password
   */
  static async signUp(email, password, fullName, role = "CUSTOMER") {
    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanPassword = String(password || "");
    const cleanName = String(fullName || "").trim();

    if (!cleanEmail || !cleanPassword || !cleanName) {
      return {
        status: "failed",
        error: "Please fill in all required fields.",
      };
    }

    try {
      const regRes = await authService.register({
        email: cleanEmail,
        password: cleanPassword,
        full_name: cleanName,
        role: role,
      });

      if (regRes?.access_token) {
        return {
          status: "complete",
          token: regRes.access_token,
          user: {
            id: String(regRes.user.id),
            email: regRes.user.email,
            fullName: regRes.user.full_name || cleanName,
            role: regRes.user.role || role,
          },
        };
      }

      return {
        status: "failed",
        error: "Registration failed. No access token received.",
      };
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        "Unable to create account.";
      return {
        status: "failed",
        error: detail,
      };
    }
  }

  /**
   * Google OAuth Sign-In Placeholder / Notice
   */
  static async signInWithGoogle() {
    return {
      status: "failed",
      error: "Google Sign-In is not configured for local development.",
    };
  }

  /**
   * Sign Out
   */
  static async signOut() {
    await tokenCache.clearToken("clerk_session_token");
  }
}

