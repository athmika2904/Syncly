// src/services/api.js
import axios from "axios";
import { API_URL } from "../config";

const api = axios.create({
  baseURL: API_URL
});


let unauthorizedHandler = null;

export const setUnauthorizedHandler = (handler) => {
  unauthorizedHandler = handler;
};

const getAuthorizationHeader = (config) => {
  const headers = config?.headers;

  if (!headers) return undefined;

  return typeof headers.get === "function"
    ? headers.get("Authorization")
    : headers.Authorization;
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    
    if (
      error.response?.status === 401 &&
      getAuthorizationHeader(error.config) &&
      unauthorizedHandler
    ) {
      unauthorizedHandler();
    }

    return Promise.reject(error);
  }
);

export default api;