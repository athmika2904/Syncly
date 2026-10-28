const apiUrl = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/$/, "");
 
export const API_URL = apiUrl;

export const SOCKET_URL = (
  import.meta.env.VITE_SOCKET_URL || apiUrl.replace(/\/api$/, "")
).replace(/\/$/, "");