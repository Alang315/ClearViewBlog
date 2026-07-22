import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";


import "dotenv/config";

import fs from "fs";
import path from "path";

import { connectDB } from "./lib/db.js";

import authRoutes from "./routes/auth.route.js";


const app = express();


const PORT = process.env.PORT;
const FRONTEND_URL = process.env.FRONTEND_URL;

app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: FRONTEND_URL, credentials: true }));

app.use("/api/auth", authRoutes);


app.listen(PORT, () => {
  connectDB();
  console.log("Server is up and running on PORT:", PORT);

});