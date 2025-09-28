import express from "express";
import cors from "cors";
import session from "express-session";
import pgSession from "connect-pg-simple";
import "dotenv/config";
import { pool } from "./storage/pool.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import teamRoutes from "./routes/teams.js";

const app = express();

// CORS: allow frontend & send cookies
app.use(
  cors({
    origin: "http://localhost:3001",
    credentials: true,
  })
);

app.use(express.json());

// Sessions (Postgres store)
const PgSession = pgSession(session);
app.use(
  session({
    store: new PgSession({ pool, tableName: "user_sessions" }),
    name: "sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax", // use "none" + secure:true if cross-site over HTTPS
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
);

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/teams", teamRoutes);

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`API on http://localhost:${port}`));
