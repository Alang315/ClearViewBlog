import mysql from "mysql2/promise";

const {
  DB_HOST = "localhost",
  DB_PORT = "3306",
  DB_USER,
  DB_KEY,
  DB_NAME,
} = process.env;

if (!DB_USER) {
  throw new Error("DB_USER is required");
}

if (!DB_KEY) {
  throw new Error("DB_KEY is required");
}

if (!DB_NAME) {
  throw new Error("DB_NAME is required");
}

export const db = mysql.createPool({
  host: DB_HOST,
  port: Number(DB_PORT),
  user: DB_USER,
  password: DB_KEY,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function connectDB() {
  const connection = await db.getConnection();

  try {
    await connection.ping();
    console.log("MySQL connected");
  } finally {
    connection.release();
  }
}