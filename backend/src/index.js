import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";


import "dotenv/config";

import { connectDB } from "./lib/db.js";

import authRoutes from "./routes/auth.route.js";
import publicationsRoutes from "./routes/publications.route.js";
import categoryRoutes from "./routes/category.route.js";
import likesRoutes from "./routes/likes.route.js";

const app = express();

const PORT = process.env.PORT;
const FRONTEND_URL = process.env.FRONTEND_URL;

app.use(express.json({ limit: "2mb" }));

app.use(
  express.urlencoded({
    extended: true,
    limit: "2mb",
  })
);

app.use(cookieParser());
app.use(cors({ origin: FRONTEND_URL, credentials: true }));

app.use("/api/auth", authRoutes);
app.use("/api/publications", publicationsRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/likes", likesRoutes);

app.listen(PORT, () => {
  connectDB();
  console.log("Server is up and running on PORT:", PORT);
});