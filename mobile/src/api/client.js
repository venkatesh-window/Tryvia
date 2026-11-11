import axios from "axios";
import { Platform } from "react-native";
import Constants from "expo-constants";
import { getItemAsync, deleteItemAsync } from "../utils/storage";

export const getBaseUrl = () => {
  // If explicitly configured in environment variables, use it
  if (
    process.env.EXPO_PUBLIC_API_URL &&
    !process.env.EXPO_PUBLIC_API_URL.includes("localhost")
  ) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Authoritative Render Production Backend
  return "https://tryvia-ta57.onrender.com/api/v1";
};

const BASE_URL = getBaseUrl();

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 45000,
  headers: {
    "Content-Type": "application/json",
  },
});

const TOKEN_KEY = "tryvia_jwt_token";
const USER_KEY = "tryvia_user_profile";

let unauthorizedHandler = null;
export const setUnauthorizedHandler = (fn) => {
  unauthorizedHandler = fn;
};

// Request Interceptor: Attach JWT token if it exists
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await getItemAsync(TOKEN_KEY);
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error("Error fetching token for request:", error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response Interceptor: Handle global errors like 401 Unauthorized on protected routes
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const requestUrl = error.config?.url || "";
    const isAuthEndpoint =
      requestUrl.includes("/auth/login") ||
      requestUrl.includes("/auth/register") ||
      requestUrl.includes("/auth/sync") ||
      requestUrl.includes("/auth/vendor/register");
    // Only clear token if 401 happens on a protected API route (not during login/register/sync)
    if (error.response && error.response.status === 401 && !isAuthEndpoint) {
      await deleteItemAsync(TOKEN_KEY);
      await deleteItemAsync(USER_KEY);
      if (typeof unauthorizedHandler === "function") {
        unauthorizedHandler();
      }
    }
    return Promise.reject(error);
  },
);
