import cors from "cors";

const corsOptions: cors.CorsOptions = {
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
};

export default cors(corsOptions);