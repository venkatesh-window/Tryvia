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
};
