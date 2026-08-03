import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./app/db/schema.ts",
  out: "./app/db/migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.DUENOW_DATABASE_PATH ?? "data/duenow.sqlite",
  },
});
