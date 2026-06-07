import dotenv from "dotenv";
import path from "path";
import { defineConfig } from "drizzle-kit";

const envPath = path.resolve(process.cwd(), "../../.env");

console.log("cwd =", process.cwd());
console.log("envPath =", envPath);

const result = dotenv.config({
  path: envPath,
});

console.log("dotenv result =", result);
console.log("DATABASE_URL =", process.env.DATABASE_URL);

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL, ensure the database is provisioned");
}

export default defineConfig({
  schema: "./src/schema/index.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});