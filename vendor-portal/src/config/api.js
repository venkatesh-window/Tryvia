// Centralized API configuration for Vendor Portal
// Defaults to Render backend in production/fallback, or overridden by VITE_API_URL
export const API_URL = import.meta.env.VITE_API_URL || 'https://tryvia-ta57.onrender.com/api/v1';

export const getApiErrorMessage = (err, fallback = "An error occurred. Please try again.") => {
  if (err?.response?.data?.detail) {
    return err.response.data.detail;
  }
  if (err?.response?.data?.message) {
    return err.response.data.message;
  }
  if (err?.message === "Network Error" || !err?.response) {
    return "Network error: Unable to connect to backend server. If the server is waking up from sleep, please wait 15-30 seconds and retry.";
  }
  return err?.message || fallback;
};

