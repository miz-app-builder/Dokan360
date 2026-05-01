import axios from "axios";

export const API = axios.create({
  baseURL: "/api"
});

// Attach JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("dokan360_token");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

// Auto-logout on 401
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("dokan360_token");
      localStorage.removeItem("dokan360_user");
      window.location.reload();
    }
    return Promise.reject(err);
  }
);
