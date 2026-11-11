import { apiClient } from "../client";
import { TokenResponseSchema, UserSchema } from "../schemas/auth";
import qs from "qs";

export const authService = {
  /**
   * Logs in a user
   */
  login: async (payload) => {
    const response = await apiClient.post("/auth/login", {
      email: payload.email || payload.username,
      password: payload.password,
    });
    return TokenResponseSchema.parse(response.data);
  },

  /**
   * Registers a new user
   */
  register: async (payload) => {
    const response = await apiClient.post("/auth/register", {
      email: payload.email,
      password: payload.password,
      full_name: payload.full_name || payload.fullName,
      role: payload.role || "CUSTOMER",
    });
    return TokenResponseSchema.parse(response.data);
  },

  /**
   * Fetches the current authenticated user's profile
   */
  getMe: async () => {
    const response = await apiClient.get("/auth/me");
    return UserSchema.parse(response.data);
  },

  /**
   * Syncs an OAuth user (e.g., Google) with the backend
   */
  sync: async (payload) => {
    const cleanEmail = String(payload.email || "").trim().toLowerCase();
    const cleanName = String(payload.fullName || payload.full_name || "").trim();
    const response = await apiClient.post("/auth/sync", {
      email: cleanEmail,
      ...(cleanName ? { full_name: cleanName } : {}),
      ...(payload.google_access_token
        ? { google_access_token: payload.google_access_token }
        : {}),
    });
    return TokenResponseSchema.parse(response.data);
  },

  /**
   * Permanently deletes/deactivates the currently authenticated user account
   */
  deleteAccount: async () => {
    const response = await apiClient.delete("/auth/me");
    return response.data;
  },
};
