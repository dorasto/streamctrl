import { pgTable, text, timestamp, jsonb, uuid } from "drizzle-orm/pg-core";
import { user } from "./auth-schema";
export const profile = pgTable("profile", {
  id: uuid("id").primaryKey(),
  name: text("name"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  connection: jsonb("connection").notNull().default({
    ip: "",
    password: "",
  }),
});
