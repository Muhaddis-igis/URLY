import 'dotenv/config';
import { drizzle } from "drizzle-orm/mysql2";

export const db = drizzle(process.env.DATABASE_URL);

async function testConnection() {
  try {
    await db.execute("SELECT 1");
    console.log("✅Database connected successfully");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
  }
}

testConnection();
