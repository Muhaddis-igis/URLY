import IORedis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

export const redis = new IORedis({
  host: process.env.REDIS_HOST|| "127.0.0.1",
  port: process.env.REDIS_PORT||6379,
  maxRetriesPerRequest: null,
});

try {
  const res = await redis.ping();
  console.log("Redis status:", res);
} catch (err) {
  console.error("Redis NOT connected:", err.message);
}