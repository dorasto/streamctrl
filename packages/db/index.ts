import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "db/schema/index";

export const db = drizzle(process.env.DATABASE_URL!);
export { schema };
