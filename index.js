/** @format */

import express from "express";
import dotenv from "dotenv";
import { PORT } from "./src/constants/constant.js";
import cors from "cors";
import cookieParser from "cookie-parser";
dotenv.config();

// routes import
import userRoutes from "./src/routes/user.js";
import journalRoutes from "./src/routes/journal.js";
const app = express();

// middlewares
app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// routes
app.use("/api/user", userRoutes);
app.use("/api/journal", journalRoutes);

const startServer = () => {
  try {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.log(error);
  }
};

startServer();
