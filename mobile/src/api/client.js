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
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

const TOKEN_KEY = "tryvia_jwt_token";

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
    // Only clear token if 401 happens on a protected API route (not during login)
    if (
      error.response &&
      error.response.status === 401 &&
      !requestUrl.includes("/auth/login")
    ) {
      await deleteItemAsync(TOKEN_KEY);
    }
    return Promise.reject(error);
  },
);
