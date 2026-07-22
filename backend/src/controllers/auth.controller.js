import bcrypt from "bcryptjs";

import { db } from "../lib/db.js";
import { generateToken } from "../lib/utils.js";
import { serializeUser } from "../models/user.model.js";


export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;

  try {
    if (
      typeof fullName !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !fullName.trim() ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    if (fullName.trim().length > 100) {
      return res.status(400).json({
        message: "Full name cannot exceed 100 characters",
      });
    }

    if (email.trim().length > 150) {
      return res.status(400).json({
        message: "Email cannot exceed 150 characters",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    const normalizedFullName = fullName.trim();
    const normalizedEmail = email.trim().toLowerCase();

    const defaultRole = 1;

    // Friendly early check. The UNIQUE constraint remains the final
    // protection against simultaneous signup requests.
    const [existingUsers] = await db.execute(
      `
        SELECT id
        FROM users
        WHERE email = ? 
        AND archived = 0
        LIMIT 1
      `,
      [normalizedEmail],
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        message: "User already exists"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [insertResult] = await db.execute(
      `
        INSERT INTO users (
          role_id,
          full_name,
          email,
          password_hash,
          created_at,
          updated_at,
          archived
        )
        VALUES (?, ?, ?, ?, NOW(), NOW(), FALSE)
      `,
      [
        defaultRole,
        normalizedFullName,
        normalizedEmail,
        hashedPassword,
      ],
    );

    const [createdUsers] = await db.execute(
      `
        SELECT
          id,
          full_name AS fullName,
          email,
          NULL AS profilePic
        FROM users
        WHERE id = ?
          AND archived = 0
        LIMIT 1
      `,
      [insertResult.insertId],
    );

    const newUser = createdUsers[0];

    if (!newUser) {
      throw new Error(
        "User was inserted but could not be retrieved",
      );
    }

    generateToken(newUser.id, res);

    return res.status(201).json(
      serializeUser(newUser)
    );
  } catch (error) {
    console.error("Error in signup controller:", error);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const [users] = await db.execute(
      `
        SELECT
          u.id,
          u.full_name AS fullName,
          u.email,
          u.password_hash AS passwordHash,
          r.name AS role,
          NULL AS profilePic
        FROM users AS u
        INNER JOIN roles AS r
          ON r.id = u.role_id
        WHERE u.email = ?
          AND u.archived = FALSE
          AND r.archived = FALSE
        LIMIT 1
      `,
      [normalizedEmail],
    );

    const user = users[0];

    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.passwordHash,
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    generateToken(user.id, res);

    return res.status(200).json(
      serializeUser(user)
    );
  } catch (error) {
    console.error("Error in login controller:", error);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

export const logout = (req, res) => {
  try {
    res.clearCookie("jwt", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite:
        process.env.NODE_ENV === "production"
          ? "none"
          : "lax",
      path: "/",
    });

    return res.status(200).json({
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Error in logout controller:", error);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

export const checkAuth = (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    return res.status(200).json(req.user);
  } catch (error) {
    console.error("Error in checkAuth controller:", error);

    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};