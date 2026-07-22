import jwt from "jsonwebtoken";

import { db } from "../lib/db.js";
import { serializeUser } from "../models/user.model.js";

export const protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies.jwt;

    if (!token) {
      return res.status(401).json({
        message: "Unauthorized - No token provided",
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is required");
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET,
    );

    if (
      typeof decoded !== "object" ||
      !decoded.userId
    ) {
      return res.status(401).json({
        message: "Unauthorized - Invalid token",
      });
    }

    const [users] = await db.execute(
      `
        SELECT
          u.id,
          u.full_name AS fullName,
          u.email,
          r.name AS role
        FROM users AS u
        INNER JOIN roles AS r
          ON r.id = u.role_id
        WHERE u.id = ?
          AND u.archived = FALSE
          AND r.archived = FALSE
        LIMIT 1
      `,
      [decoded.userId],
    );

    const user = users[0];

    if (!user) {
      return res.status(401).json({
        message: "Unauthorized - User not found",
      });
    }

    req.user = {
      ...serializeUser(user),
      role: user.role,
    };

    return next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError" ||
      error.name === "NotBeforeError"
    ) {
      return res.status(401).json({
        message: "Unauthorized - Invalid or expired token",
      });
    }

    console.error(
      "Error in protectRoute middleware:",
      error,
    );

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};