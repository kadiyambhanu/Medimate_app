import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const data = error.response?.data;
    const message =
      (typeof data === "object" && data !== null && "message" in data && typeof data.message === "string"
        ? data.message
        : null) || error.message || "An error occurred";
    return Promise.reject(new Error(message));
  }
);

export default api;
