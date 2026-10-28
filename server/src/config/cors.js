

const DEV_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"];


export const getAllowedOrigins = () => {
  const configured = (process.env.CLIENT_URL || "")
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean);

  if (configured.length > 0) return configured;

  return process.env.NODE_ENV === "production" ? [] : DEV_ORIGINS;
};

export const corsOptions = {
  origin(origin, callback) {
    
    if (!origin) return callback(null, true);

    
    callback(null, getAllowedOrigins().includes(origin));
  }
};