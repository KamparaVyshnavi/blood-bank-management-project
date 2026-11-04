import "server-only";
import { MongoClient } from "mongodb";
import { RegistryError } from "./errors";
import { databaseFault } from "./demo-controls";
import { span } from "./telemetry";
import { validDatabaseName } from "./database-config";

// One pool per warm process, including Next development hot reloads. No per-request close.
const cache = globalThis as typeof globalThis & { pulsegridMongo?: Promise<MongoClient> };
export function databaseName() {
  const name = process.env.MONGODB_DB_NAME?.trim();
  // Allow development, preview and production names while excluding MongoDB
  // forbidden characters and reserved system databases.
  if (!name || !validDatabaseName(name)) {
    throw new RegistryError(503, "DATABASE_NOT_CONFIGURED");
  }
  return name;
}
export function mongoClient(): Promise<MongoClient> {
  if (!process.env.MONGODB_URI) throw new RegistryError(503, "DATABASE_NOT_CONFIGURED");
  if (!cache.pulsegridMongo) {
    const client = new MongoClient(process.env.MONGODB_URI, {
      appName: "blood-bank-management-system", maxPoolSize: 5, minPoolSize: 0,
      maxIdleTimeMS: 60_000, serverSelectionTimeoutMS: 5_000, waitQueueTimeoutMS: 5_000
    });
    cache.pulsegridMongo = client.connect().catch(async () => {
      cache.pulsegridMongo = undefined;
      await client.close().catch(() => undefined);
      throw new RegistryError(503, "DATABASE_UNAVAILABLE");
    });
  }
  return cache.pulsegridMongo!;
}
export async function database() {
  return span("atlas", "database-access", async () => {
    await databaseFault();
    const name = databaseName(); return (await mongoClient()).db(name);
  });
}
