import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { DEFAULT_DATABASE_URL } from "./constants";
import * as schema from "./schema";

const globalForDatabase = globalThis as {
  postgresClient?: ReturnType<typeof postgres>;
};

const connectionString = process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL;

const postgresClient =
  globalForDatabase.postgresClient ??
  postgres(connectionString, {
    max: 1,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDatabase.postgresClient = postgresClient;
}

export const db = drizzle(postgresClient, {
  schema,
  casing: "snake_case",
});

export type Database = typeof db;

export async function closeDatabaseConnection() {
  await postgresClient.end();
}
