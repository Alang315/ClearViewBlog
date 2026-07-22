import jwt from "jsonwebtoken";

export const generateToken = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.cookie("jwt", token, {
    maxAge: 7 * 24 * 60 * 60 * 1000, // MS
    httpOnly: true, // prevent XSS attacks and cross-site scripting attacks
    sameSite: "strict",
    secure: process.env.NODE_ENV !== "development",
  });

  return token;
};

export const getSafeString = (value) => {
  return typeof value === "string" ? value.trim() : "";
};

export const slugify = (value) => {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 200);
};

export const isValidImageMimeType = (mimeType) => {
  return ["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(mimeType);
};
